/**
 * Standalone geocoding script for DPRP shelters.
 * Uses Photon geocoder (photon.komoot.io) — powered by OpenStreetMap data.
 *
 * Usage: npx tsx server/scripts/geocode-shelters.ts
 *
 * - Rate-limited to 1 req/sec to be respectful
 * - Saves results to data/shelter-coordinates.json
 * - Supports resume: re-running skips already-geocoded shelters
 * - ~15-17 minutes for 914 shelters on first run
 */

import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Types ──────────────────────────────────────────────────────────────────

interface ShelterCoordinate {
  name: string;
  parish: string;
  location: string;
  lat: number;
  lng: number;
  geocoded: boolean;
  source: 'photon' | 'parish_centroid';
}

interface PhotonFeature {
  geometry: {
    type: string;
    coordinates: [number, number]; // [lon, lat]
  };
  properties: {
    name?: string;
    country?: string;
    countrycode?: string;
    county?: string;
    city?: string;
    state?: string;
  };
}

interface PhotonResponse {
  type: string;
  features: PhotonFeature[];
}

interface ParsedShelter {
  name: string;
  parish: string;
  location: string | null;
}

// ── Parish centroids (fallback) ────────────────────────────────────────────

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

// Jamaica bounding box for filtering results
const JM_BOUNDS = { minLat: 17.5, maxLat: 18.6, minLng: -78.5, maxLng: -76.0 };

// ── Parish normalization (reused from seed) ────────────────────────────────

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

const normalizeParish = (raw: string): string => {
  const trimmed = raw.trim();
  return PARISH_NORMALIZATION[trimmed] ?? trimmed;
};

// ── Helpers ────────────────────────────────────────────────────────────────

const makeKey = (name: string, parish: string): string => {
  return `${name.toLowerCase().trim()}::${parish.toLowerCase().trim()}`;
};

const addJitter = (base: number): number => {
  return base + (Math.random() - 0.5) * 0.1; // ±0.05 degrees
};

const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Clean location string for better geocoding results.
 * Removes postal abbreviations and redundant parish suffixes.
 */
const cleanLocation = (location: string, parish: string): string => {
  let cleaned = location;

  // Remove common postal/addressing prefixes that confuse geocoders
  cleaned = cleaned.replace(/\bP\.?A\.?,?\s*/gi, '');
  cleaned = cleaned.replace(/\bP\.?O\.?,?\s*/gi, '');

  // Remove trailing parish name to avoid duplication like "Bath, St. Thomas, St. Thomas, Jamaica"
  const parishPattern = new RegExp(`,?\\s*${escapeRegex(parish)}\\s*\\.?\\s*$`, 'i');
  cleaned = cleaned.replace(parishPattern, '');

  // Clean up resulting whitespace and trailing commas/periods
  cleaned = cleaned.replace(/[,.\s]+$/, '').trim();

  return cleaned || location; // fallback to original if we cleaned everything away
};

const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const isInJamaica = (lat: number, lng: number): boolean => {
  return lat >= JM_BOUNDS.minLat && lat <= JM_BOUNDS.maxLat &&
         lng >= JM_BOUNDS.minLng && lng <= JM_BOUNDS.maxLng;
};

// ── Photon API ─────────────────────────────────────────────────────────────

const PHOTON_BASE = 'https://photon.komoot.io/api/';

async function photonSearch(query: string, retries = 3): Promise<{ lat: number; lng: number } | null> {
  // Photon supports bbox parameter and country bias via lat/lon
  // Use Jamaica center as location bias
  const params = new URLSearchParams({
    q: query,
    limit: '3',
    lang: 'en',
    lat: '18.1',
    lon: '-77.3',
    // Photon doesn't support countrycodes, but location bias helps
  });
  const url = `${PHOTON_BASE}?${params}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        headers: { 'User-Agent': 'DPRP-Hackathon/1.0 (disaster-preparedness-platform)' },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.status === 429) {
        console.warn(`  Rate limited (attempt ${attempt}/${retries}), waiting 5s...`);
        await sleep(5000);
        continue;
      }

      if (!response.ok) {
        console.warn(`  HTTP ${response.status} for query: ${query}`);
        return null;
      }

      const text = await response.text();
      let data: PhotonResponse;
      try {
        data = JSON.parse(text) as PhotonResponse;
      } catch {
        console.warn(`  Invalid JSON response for query: ${query}`);
        return null;
      }

      // Find the first result that's actually in Jamaica
      for (const feature of data.features) {
        const [lon, lat] = feature.geometry.coordinates;
        const cc = feature.properties.countrycode;
        if (cc === 'JM' || isInJamaica(lat, lon)) {
          return { lat, lng: lon };
        }
      }

      // No Jamaica result found
      return null;
    } catch (err) {
      console.warn(`  Network error (attempt ${attempt}/${retries}): ${(err as Error).message}`);
      if (attempt < retries) await sleep(2000);
    }
  }

  return null;
}

// ── Geocode a single shelter with fallback chain ───────────────────────────

async function geocodeShelter(
  shelter: ParsedShelter
): Promise<{ lat: number; lng: number; geocoded: boolean; source: 'photon' | 'parish_centroid' }> {
  const { name, parish, location } = shelter;

  // Build query candidates in priority order
  const queries: string[] = [];

  if (location) {
    const cleaned = cleanLocation(location, parish);
    // Full location + parish + Jamaica
    queries.push(`${cleaned}, ${parish}, Jamaica`);
    // Town/district only (first part before comma) + parish + Jamaica
    const firstPart = cleaned.split(',')[0].trim();
    if (firstPart !== cleaned) {
      queries.push(`${firstPart}, ${parish}, Jamaica`);
    }
  }

  // Shelter name + parish + Jamaica
  queries.push(`${name}, ${parish}, Jamaica`);

  // Parish only
  queries.push(`${parish}, Jamaica`);

  // Try each query in order
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    const result = await photonSearch(query);

    if (result) {
      return {
        lat: result.lat,
        lng: result.lng,
        geocoded: true,
        source: 'photon',
      };
    }

    // Rate limit between fallback queries
    if (i < queries.length - 1) {
      await sleep(1100);
    }
  }

  // All queries failed — fall back to parish centroid with jitter
  console.warn(`  FALLBACK: Using parish centroid for "${name}" (${parish})`);
  const centroid = PARISH_CENTROIDS[parish];
  if (centroid) {
    return {
      lat: addJitter(centroid.lat),
      lng: addJitter(centroid.lng),
      geocoded: false,
      source: 'parish_centroid',
    };
  }

  // Unknown parish — use Kingston as last resort
  console.warn(`  Unknown parish "${parish}", defaulting to Kingston centroid`);
  return {
    lat: addJitter(18.0179),
    lng: addJitter(-76.8099),
    geocoded: false,
    source: 'parish_centroid',
  };
}

// ── Parse Excel ────────────────────────────────────────────────────────────

function parseSheltersFromExcel(): ParsedShelter[] {
  const xlsxPath = path.resolve(__dirname, '../../data/National-Shelter-Listing-2025-2026.xlsx');
  const workbook = XLSX.readFile(xlsxPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<(string | number | undefined)[]>(sheet, { header: 1 });

  const shelters: ParsedShelter[] = [];

  // Data starts at row 6 (index), header is row 5
  for (let i = 6; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[1]) continue;

    const rawParish = String(row[1]).trim();
    if (rawParish.length > 30 || rawParish === 'PARISH') continue;

    const parish = normalizeParish(rawParish);
    const name = String(row[2] ?? '').trim();
    const location = row[3] ? String(row[3]).trim() : null;

    if (!name) continue;

    shelters.push({ name, parish, location });
  }

  return shelters;
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('=== DPRP Shelter Geocoding (Photon) ===\n');

  // Parse shelters from Excel
  const shelters = parseSheltersFromExcel();
  console.log(`Parsed ${shelters.length} shelters from Excel\n`);

  // Load existing cache for resume support
  const outputPath = path.resolve(__dirname, '../../data/shelter-coordinates.json');
  let cache: Record<string, ShelterCoordinate> = {};

  if (fs.existsSync(outputPath)) {
    try {
      cache = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
      const existing = Object.values(cache).filter(c => c.geocoded).length;
      console.log(`Loaded existing cache: ${Object.keys(cache).length} entries (${existing} geocoded)\n`);
    } catch {
      console.warn('Could not parse existing cache, starting fresh\n');
    }
  }

  // Stats
  let successful = 0;
  let fallback = 0;
  let skipped = 0;
  let processed = 0;

  for (const shelter of shelters) {
    const key = makeKey(shelter.name, shelter.parish);
    processed++;

    // Resume support: skip already-geocoded shelters
    if (cache[key]?.geocoded) {
      skipped++;
      successful++;
      continue;
    }

    // Geocode
    const result = await geocodeShelter(shelter);

    cache[key] = {
      name: shelter.name,
      parish: shelter.parish,
      location: shelter.location ?? '',
      lat: result.lat,
      lng: result.lng,
      geocoded: result.geocoded,
      source: result.source,
    };

    if (result.geocoded) {
      successful++;
    } else {
      fallback++;
    }

    // Per-shelter log (compact)
    const active = processed - skipped;
    const status = result.geocoded ? 'OK' : 'FALLBACK';
    console.log(`  [${active}/${shelters.length}] ${status}: ${shelter.name} (${shelter.parish})`);

    // Save cache periodically (every 25 shelters) so we don't lose progress
    if (active > 0 && active % 25 === 0) {
      fs.writeFileSync(outputPath, JSON.stringify(cache, null, 2));
    }

    // Rate limit: 1100ms between requests
    await sleep(1100);
  }

  // Final save
  fs.writeFileSync(outputPath, JSON.stringify(cache, null, 2));

  // Summary
  console.log('\n=== Geocoding Complete ===');
  console.log(`Total shelters:  ${shelters.length}`);
  console.log(`Skipped (cached): ${skipped}`);
  console.log(`Successful:       ${successful}`);
  console.log(`Fallback:         ${fallback}`);
  console.log(`\nResults saved to: ${outputPath}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
