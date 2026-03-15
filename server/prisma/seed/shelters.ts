import { PrismaClient } from '@prisma/client';
import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ShelterCoordinate {
  name: string;
  parish: string;
  location: string;
  lat: number;
  lng: number;
  geocoded: boolean;
  source: 'photon' | 'parish_centroid';
}

/** Load geocoded coordinates from cache file if it exists */
function loadGeocodedCoordinates(): Record<string, ShelterCoordinate> {
  const coordsPath = path.resolve(__dirname, '../../../data/shelter-coordinates.json');
  if (fs.existsSync(coordsPath)) {
    try {
      return JSON.parse(fs.readFileSync(coordsPath, 'utf-8'));
    } catch {
      console.warn('  Warning: Could not parse shelter-coordinates.json, using parish centroids');
    }
  }
  return {};
}

const PARISH_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  'St. Thomas':            { lat: 17.9714, lng: -76.2874 },
  'Portland':              { lat: 18.1489, lng: -76.3980 },
  'St. Mary':              { lat: 18.2469, lng: -76.7776 },
  'St. Ann':               { lat: 18.3474, lng: -77.2036 },
  'Trelawny':              { lat: 18.3500, lng: -77.6000 },
  'St. James':             { lat: 18.4762, lng: -77.9190 },
  'Hanover':               { lat: 18.4000, lng: -78.1300 },
  'Westmoreland':          { lat: 18.2500, lng: -78.1500 },
  'St. Elizabeth':         { lat: 18.0000, lng: -77.7500 },
  'Manchester':            { lat: 18.0500, lng: -77.5000 },
  'Clarendon':             { lat: 17.9500, lng: -77.2400 },
  'St. Catherine':         { lat: 18.0300, lng: -76.9500 },
  'Kingston & St. Andrew': { lat: 18.0179, lng: -76.8099 },
  'Portmore':              { lat: 17.9576, lng: -76.8777 },
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

const addJitter = (base: number): number => {
  return base + (Math.random() - 0.5) * 0.04; // ±0.02 degrees
};

export async function seedShelters(prisma: PrismaClient): Promise<void> {
  const xlsxPath = path.resolve(__dirname, '../../../data/National-Shelter-Listing-2025-2026.xlsx');
  const workbook = XLSX.readFile(xlsxPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<(string | number | undefined)[]>(sheet, { header: 1 });

  // Load geocoded coordinates if available
  const geocoded = loadGeocodedCoordinates();
  const hasGeocodedData = Object.keys(geocoded).length > 0;
  if (hasGeocodedData) {
    console.log(`  Using geocoded coordinates (${Object.keys(geocoded).length} entries)`);
  } else {
    console.log('  No geocoded data found, using parish centroids (run geocode-shelters.ts first)');
  }

  const shelters: {
    name: string;
    parish: string;
    location: string | null;
    areasServed: string | null;
    facilityType: string | null;
    lat: number | null;
    lng: number | null;
  }[] = [];

  let geocodedCount = 0;

  // Data starts at row 6 (index), header is row 5
  for (let i = 6; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[1]) continue;

    const rawParish = String(row[1]).trim();
    if (rawParish.length > 30 || rawParish === 'PARISH') continue;

    const parish = normalizeParish(rawParish);
    const name = String(row[2] ?? '').trim();

    // Look up geocoded coordinates
    const key = `${name.toLowerCase().trim()}::${parish.toLowerCase().trim()}`;
    const coords = geocoded[key];

    let lat: number | null;
    let lng: number | null;

    if (coords) {
      lat = coords.lat;
      lng = coords.lng;
      if (coords.geocoded) geocodedCount++;
    } else {
      const centroid = PARISH_CENTROIDS[parish];
      lat = centroid ? addJitter(centroid.lat) : null;
      lng = centroid ? addJitter(centroid.lng) : null;
    }

    shelters.push({
      name,
      parish,
      location: row[3] ? String(row[3]).trim() : null,
      areasServed: row[4] ? String(row[4]).trim() : null,
      facilityType: row[5] ? normalizeFacilityType(String(row[5])) : null,
      lat,
      lng,
    });
  }

  await prisma.shelter.createMany({ data: shelters, skipDuplicates: true });

  const parishes = new Set(shelters.map(s => s.parish));
  console.log(`  Seeded ${shelters.length} shelters across ${parishes.size} parishes`);
  if (hasGeocodedData) {
    console.log(`  ${geocodedCount} with Nominatim coordinates, ${shelters.length - geocodedCount} with fallback`);
  }
}
