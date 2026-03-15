import { PrismaClient } from '@prisma/client';
import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PARISH_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  'St. Thomas':            { lat: 17.9714, lng: -76.2356 },
  'Portland':              { lat: 18.1489, lng: -76.4133 },
  'St. Mary':              { lat: 18.2419, lng: -76.7011 },
  'St. Ann':               { lat: 18.2816, lng: -77.2011 },
  'Trelawny':              { lat: 18.3527, lng: -77.6078 },
  'St. James':             { lat: 18.4298, lng: -77.9200 },
  'Hanover':               { lat: 18.4040, lng: -78.1350 },
  'Westmoreland':          { lat: 18.2500, lng: -78.1500 },
  'St. Elizabeth':         { lat: 18.0667, lng: -77.8333 },
  'Manchester':            { lat: 18.0333, lng: -77.5000 },
  'Clarendon':             { lat: 17.9667, lng: -77.2333 },
  'St. Catherine':         { lat: 18.0333, lng: -76.9333 },
  'Kingston & St. Andrew': { lat: 18.0179, lng: -76.8099 },
  'Portmore':              { lat: 17.9500, lng: -76.8833 },
};

const PARISH_NORMALIZATION: Record<string, string> = {
  'St Thomas':    'St. Thomas',
  'St. Thomas':   'St. Thomas',
  'St James':     'St. James',
  'St. James':    'St. James',
  'St Elizabeth': 'St. Elizabeth',
  'St. Elizabeth':'St. Elizabeth',
  'St Mary':      'St. Mary',
  'St. Mary':     'St. Mary',
  'St. Ann':      'St. Ann',
  'St Ann':       'St. Ann',
  'St. Catherine':'St. Catherine',
  'St Catherine': 'St. Catherine',
};

const FACILITY_TYPE_NORMALIZATION: Record<string, string> = {
  'Goverrnment School': 'Government School',
  'Government School.':  'Government School',
  'Community Center':    'Community Centre',
};

const normalizeFacilityType = (raw: string): string => {
  const trimmed = raw.trim();
  return FACILITY_TYPE_NORMALIZATION[trimmed] ?? trimmed;
};

const normalizeParish = (raw: string): string => {
  const trimmed = raw.trim();
  return PARISH_NORMALIZATION[trimmed] ?? trimmed;
};

const addJitter = (base: number, range: number): number => {
  return base + (Math.random() - 0.5) * range;
};

export const seedShelters = async (prisma: PrismaClient): Promise<number> => {
  const xlsxPath = path.resolve(__dirname, '../../../data/National-Shelter-Listing-2025-2026.xlsx');
  const workbook = XLSX.readFile(xlsxPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<(string | number | undefined)[]>(sheet, { header: 1 });

  const shelters: {
    name: string;
    parish: string;
    location: string | null;
    areasServed: string | null;
    facilityType: string | null;
    lat: number | null;
    lng: number | null;
  }[] = [];

  // Data starts at row 6 (index), header is row 5
  for (let i = 6; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[1]) continue;

    const rawParish = String(row[1]).trim();
    if (rawParish.length > 30 || rawParish === 'PARISH') continue;

    const parish = normalizeParish(rawParish);
    const centroid = PARISH_CENTROIDS[parish];

    shelters.push({
      name: String(row[2] ?? '').trim(),
      parish,
      location: row[3] ? String(row[3]).trim() : null,
      areasServed: row[4] ? String(row[4]).trim() : null,
      facilityType: row[5] ? normalizeFacilityType(String(row[5])) : null,
      lat: centroid ? addJitter(centroid.lat, 0.15) : null,
      lng: centroid ? addJitter(centroid.lng, 0.15) : null,
    });
  }

  // Clear existing shelters
  await prisma.shelter.deleteMany();

  // Insert in batches
  const BATCH_SIZE = 100;
  for (let i = 0; i < shelters.length; i += BATCH_SIZE) {
    const batch = shelters.slice(i, i + BATCH_SIZE);
    await prisma.shelter.createMany({ data: batch });
  }

  console.log(`  Seeded ${shelters.length} shelters`);

  // Log parish breakdown
  const parishCounts: Record<string, number> = {};
  for (const s of shelters) {
    parishCounts[s.parish] = (parishCounts[s.parish] || 0) + 1;
  }
  console.log('  Parish breakdown:', parishCounts);

  return shelters.length;
};
