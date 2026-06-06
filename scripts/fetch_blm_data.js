#!/usr/bin/env node
/**
 * fetch_blm_data.js
 *
 * Fetches Arizona expired/abandoned/void mining claims from multiple official
 * BLM open-data ArcGIS REST services and saves them as
 * frontend/src/data/blm_claims.json for use at build time.
 *
 * Data Sources (all open, public domain, no API key required):
 *   1. BLM NLSDB Mining Claims MapServer (primary — polygon geometry)
 *      https://gis.blm.gov/nlsdb/rest/services/Mining_Claims/MiningClaims/MapServer
 *   2. BLM Natl MLRS Mining Claims Closed (secondary — recently updated)
 *      https://gis.blm.gov/nlsdb/rest/services/HUB/BLM_Natl_MLRS_Mining_Claims_Closed/MapServer
 *
 * Usage (from the scripts/ directory):
 *   node fetch_blm_data.js
 */

'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// BLM ArcGIS REST endpoints (open public domain)
// ---------------------------------------------------------------------------

// Primary: NLSDB Mining Claims — Layer 2 = Closed Mining Claims
const PRIMARY_ENDPOINT =
  'https://gis.blm.gov/nlsdb/rest/services/Mining_Claims/MiningClaims/MapServer/2/query';

// Secondary: HUB Closed Claims (recently modified within last year)
const SECONDARY_ENDPOINT =
  'https://gis.blm.gov/nlsdb/rest/services/HUB/BLM_Natl_MLRS_Mining_Claims_Closed/MapServer/0/query';

// WHERE clause: Arizona only, closed/abandoned/void
const PRIMARY_WHERE =
  "ADMIN_STATE='AZ' AND CSE_DISP IN ('CLOSED','ABANDONED','VOID')";

const SECONDARY_WHERE =
  "ADMIN_STATE='AZ'";

const RECORD_COUNT = 2000; // Max per page for these services
const REQUEST_TIMEOUT = 45000; // 45 seconds

const OUTPUT_FILE = path.resolve(
  __dirname,
  '..',
  'frontend',
  'src',
  'data',
  'blm_claims.json'
);

// ---------------------------------------------------------------------------
// Field mapping — normalize NLSDB fields to app schema
// ---------------------------------------------------------------------------
function mapNlsdbFeature(attrs, geometry, index) {
  // Compute centroid from polygon geometry if available
  let lat = null;
  let lng = null;

  if (geometry && geometry.rings && geometry.rings.length > 0) {
    // Calculate centroid of first ring
    const ring = geometry.rings[0];
    if (ring.length > 0) {
      let sumX = 0, sumY = 0;
      ring.forEach(([x, y]) => { sumX += x; sumY += y; });
      lng = sumX / ring.length;
      lat = sumY / ring.length;
    }
  }

  // Parse case metadata JSON if available
  let meta = {};
  if (attrs.CSE_META) {
    try {
      meta = JSON.parse(attrs.CSE_META);
    } catch {
      // CSE_META may not always be valid JSON
    }
  }

  const formatDate = (raw) => {
    if (!raw) return null;
    if (typeof raw === 'number') {
      return new Date(raw).toISOString().slice(0, 10);
    }
    return String(raw).slice(0, 10);
  };

  // Map BLM_PROD codes to human-readable claim types
  const mapClaimType = (prod, typeNr) => {
    if (prod) {
      const p = prod.toUpperCase();
      if (p.includes('LODE')) return 'LODE';
      if (p.includes('PLACER')) return 'PLACER';
      if (p.includes('TUNNEL')) return 'TUNNEL SITE';
      if (p.includes('MILL')) return 'MILLSITE';
    }
    // Fallback to type number codes
    if (typeNr) {
      const t = String(typeNr);
      if (t.startsWith('3841')) return 'LODE';
      if (t.startsWith('3842')) return 'PLACER';
      if (t.startsWith('3843')) return 'TUNNEL SITE';
      if (t.startsWith('3844')) return 'MILLSITE';
    }
    return 'LODE';
  };

  // Extract additional fields from metadata
  const claimant = meta.claimant || meta.CLAIMANT || attrs.CSE_NAME || '';
  const county = meta.county || meta.COUNTY || '';
  const township = meta.township || meta.TOWNSHIP || meta.TWP || '';
  const range = meta.range || meta.RANGE || meta.RNG || '';
  const section = meta.section || meta.SECTION || '';
  const commodity = meta.commodity || meta.COMMODITY || '';
  const closeDate = meta.close_date || meta.CLOSE_DATE || meta.closed_date || null;
  const locationDate = meta.location_date || meta.LOC_DATE || null;

  return {
    id: attrs.OBJECTID != null ? attrs.OBJECTID : index,
    blm_case_id: attrs.CSE_NR || attrs.LEG_CSE_NR || '',
    claim_name: attrs.CSE_NAME || '',
    claim_type: mapClaimType(attrs.BLM_PROD, attrs.CSE_TYPE_NR),
    claimant_name: claimant,
    case_disposition: (attrs.CSE_DISP || '').toUpperCase(),
    location_date: formatDate(locationDate),
    close_date: formatDate(closeDate),
    county: county.toUpperCase(),
    township: township,
    range: range,
    section: section ? String(section) : '',
    meridian: meta.meridian || 'GILA & SALT RIVER',
    latitude: lat,
    longitude: lng,
    acreage: attrs.RCRD_ACRS != null ? parseFloat(attrs.RCRD_ACRS) : null,
    commodity: commodity,
    maintenance_fee_paid: false,
    notes: null,
    data_quality: attrs.QLTY || null,
    patented: attrs.MC_PATENTED === 'Y',
    source: 'blm_nlsdb'
  };
}

// ---------------------------------------------------------------------------
// HTTP helper — returns parsed JSON or rejects
// ---------------------------------------------------------------------------
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: REQUEST_TIMEOUT }, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          reject(new Error(`JSON parse error: ${e.message}\nResponse: ${raw.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timed out after ${REQUEST_TIMEOUT / 1000}s`));
    });
  });
}

// ---------------------------------------------------------------------------
// Fetch paginated results from a BLM ArcGIS endpoint
// ---------------------------------------------------------------------------
async function fetchFromEndpoint(endpoint, where, label) {
  console.log(`\n[${label}] Fetching from: ${endpoint}`);
  console.log(`[${label}] WHERE: ${where}`);

  const allFeatures = [];
  let offset = 0;

  while (true) {
    const params = new URLSearchParams({
      where: where,
      outFields: '*',
      outSR: '4326',
      returnGeometry: 'true',
      resultRecordCount: String(RECORD_COUNT),
      resultOffset: String(offset),
      f: 'json'
    });

    const url = `${endpoint}?${params}`;
    let json;

    try {
      json = await fetchJson(url);
    } catch (err) {
      console.error(`[${label}] Error at offset ${offset}: ${err.message}`);
      if (allFeatures.length === 0) {
        throw new Error(`${label}: No data fetched`);
      }
      console.warn(`[${label}] Partial fetch — returning ${allFeatures.length} records`);
      break;
    }

    if (json.error) {
      const msg = json.error.message || JSON.stringify(json.error);
      console.error(`[${label}] API error: ${msg}`);
      if (allFeatures.length === 0) {
        throw new Error(`${label}: API error — ${msg}`);
      }
      break;
    }

    if (!Array.isArray(json.features)) {
      console.error(`[${label}] Unexpected response — no features array`);
      if (allFeatures.length === 0) {
        throw new Error(`${label}: No features in response`);
      }
      break;
    }

    allFeatures.push(...json.features);
    console.log(`[${label}] Fetched ${allFeatures.length} records so far…`);

    if (json.features.length < RECORD_COUNT) {
      break; // last page
    }
    offset += RECORD_COUNT;

    // Rate-limit: small delay between pages
    await new Promise(r => setTimeout(r, 500));
  }

  return allFeatures;
}

// ---------------------------------------------------------------------------
// Main pipeline
// ---------------------------------------------------------------------------
async function main() {
  console.log('=== BLM Mining Claims Data Fetcher ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('Sources: BLM NLSDB (primary) + BLM HUB Closed (secondary)');
  console.log('');

  let primaryFeatures = [];
  let secondaryFeatures = [];

  // Fetch from primary source (NLSDB Closed Mining Claims)
  try {
    primaryFeatures = await fetchFromEndpoint(
      PRIMARY_ENDPOINT,
      PRIMARY_WHERE,
      'NLSDB-Primary'
    );
    console.log(`\n[NLSDB-Primary] Total: ${primaryFeatures.length} features`);
  } catch (err) {
    console.error(`[NLSDB-Primary] FAILED: ${err.message}`);
  }

  // Fetch from secondary source (HUB recently closed)
  try {
    secondaryFeatures = await fetchFromEndpoint(
      SECONDARY_ENDPOINT,
      SECONDARY_WHERE,
      'HUB-Secondary'
    );
    console.log(`\n[HUB-Secondary] Total: ${secondaryFeatures.length} features`);
  } catch (err) {
    console.error(`[HUB-Secondary] FAILED: ${err.message}`);
    // Secondary is optional; continue with primary only
  }

  // Merge and deduplicate by case serial number
  const seenCaseNrs = new Set();
  const allClaims = [];

  // Process primary features first (higher quality)
  primaryFeatures.forEach((f, i) => {
    const claim = mapNlsdbFeature(f.attributes || {}, f.geometry || null, i);
    if (claim.blm_case_id && !seenCaseNrs.has(claim.blm_case_id)) {
      seenCaseNrs.add(claim.blm_case_id);
      allClaims.push(claim);
    } else if (!claim.blm_case_id) {
      // Include even without case ID (use OBJECTID as key)
      allClaims.push(claim);
    }
  });

  // Add secondary features not already present
  secondaryFeatures.forEach((f, i) => {
    const claim = mapNlsdbFeature(
      f.attributes || {},
      f.geometry || null,
      primaryFeatures.length + i
    );
    claim.source = 'blm_hub_closed';
    if (claim.blm_case_id && !seenCaseNrs.has(claim.blm_case_id)) {
      seenCaseNrs.add(claim.blm_case_id);
      allClaims.push(claim);
    }
  });

  if (allClaims.length === 0) {
    console.error('\nNo claims fetched from any source. Preserving existing cached data.');
    process.exit(1);
  }

  // Build output
  const output = {
    metadata: {
      fetchedAt: new Date().toISOString(),
      totalRecords: allClaims.length,
      source: 'blm_arcgis',
      sources: [
        {
          name: 'BLM NLSDB Mining Claims (Closed)',
          url: 'https://gis.blm.gov/nlsdb/rest/services/Mining_Claims/MiningClaims/MapServer/2',
          records: primaryFeatures.length,
          description: 'Official BLM Mineral & Land Records System — closed mining claims with polygon geometry'
        },
        {
          name: 'BLM HUB MLRS Mining Claims Closed',
          url: 'https://gis.blm.gov/nlsdb/rest/services/HUB/BLM_Natl_MLRS_Mining_Claims_Closed/MapServer/0',
          records: secondaryFeatures.length,
          description: 'Recently updated/modified closed claims from BLM GBP Hub'
        }
      ],
      dataLicense: 'U.S. Public Domain — U.S. Department of Interior, Bureau of Land Management',
      notes: 'Geometry derived from PLSS legal land descriptions. Data quality scores indicate mapping confidence.'
    },
    data: allClaims
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');
  console.log(`\n=== Complete ===`);
  console.log(`Saved ${allClaims.length} claims to ${OUTPUT_FILE}`);
  console.log(`Primary source: ${primaryFeatures.length} records`);
  console.log(`Secondary source: ${secondaryFeatures.length} records`);
  console.log(`After deduplication: ${allClaims.length} unique claims`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
