#!/usr/bin/env node
/**
 * fetch_blm_data.js
 *
 * Fetches Arizona expired/abandoned/void mining claims from the BLM ArcGIS
 * REST API and saves them as frontend/src/data/blm_claims.json for use at
 * build time.  Runs server-side (Node.js) so there are no CORS restrictions.
 *
 * Usage (from the scripts/ directory):
 *   node fetch_blm_data.js
 */

'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');

const BLM_ENDPOINT =
  'https://gis.blm.gov/arcgis/rest/services/mining/BLM_Natl_Mining_Claims/MapServer/0/query';

const WHERE_CLAUSE =
  "STATE_ABBR='AZ' AND CASE_DISP IN ('CLOSED','ABANDONED','VOID')";

const RECORD_COUNT = 1000;

const OUTPUT_FILE = path.resolve(
  __dirname,
  '..',
  'frontend',
  'src',
  'data',
  'blm_claims.json'
);

// ---------------------------------------------------------------------------
// Field mapping (mirrors mapBlmFeature in frontend/src/services/api.js)
// ---------------------------------------------------------------------------
function mapBlmFeature(attrs, geometry, index) {
  const lat =
    attrs.LATITUDE != null
      ? parseFloat(attrs.LATITUDE)
      : geometry && geometry.y != null
      ? parseFloat(geometry.y)
      : null;

  const lng =
    attrs.LONGITUDE != null
      ? parseFloat(attrs.LONGITUDE)
      : geometry && geometry.x != null
      ? parseFloat(geometry.x)
      : null;

  const formatDate = (raw) => {
    if (!raw) return null;
    // ArcGIS often returns epoch milliseconds
    if (typeof raw === 'number') {
      return new Date(raw).toISOString().slice(0, 10);
    }
    return String(raw).slice(0, 10);
  };

  return {
    id: attrs.OBJECTID != null ? attrs.OBJECTID : index,
    blm_case_id: attrs.CASE_ID || attrs.SERIAL_NR || '',
    claim_name: attrs.CASE_NAME || attrs.CLAIM_NAME || '',
    claim_type: (attrs.CASE_TYPE || attrs.CLAIM_TYPE || '').toUpperCase(),
    claimant_name: attrs.CLAIMANT || attrs.CLAIMANT_NAME || '',
    case_disposition: (attrs.CASE_DISP || attrs.CASE_DISPOSITION || '').toUpperCase(),
    location_date: formatDate(attrs.LOC_DATE || attrs.LOCATION_DATE),
    close_date: formatDate(attrs.CLOSE_DATE || attrs.CLOSED_DATE),
    county: (attrs.COUNTY || attrs.STR_COUNTY || '').toUpperCase(),
    township: attrs.TOWNSHIP || attrs.TWP || '',
    range: attrs.RANGE || attrs.RNG || '',
    section: attrs.SECTION ? String(attrs.SECTION) : '',
    meridian: attrs.MERIDIAN || '',
    latitude: lat,
    longitude: lng,
    acreage: attrs.ACREAGE != null ? parseFloat(attrs.ACREAGE) : null,
    commodity: attrs.COMMODITY || '',
    maintenance_fee_paid: !!(attrs.MAINT_FEE_PAID || attrs.MAINTENANCE_FEE_PAID),
    notes: attrs.NOTES || attrs.REMARKS || null
  };
}

// ---------------------------------------------------------------------------
// HTTP helper — returns parsed JSON or rejects
// ---------------------------------------------------------------------------
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 30000 }, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          reject(new Error(`JSON parse error: ${e.message}`));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out after 30 s'));
    });
  });
}

// ---------------------------------------------------------------------------
// Fetch one page of results
// ---------------------------------------------------------------------------
function buildUrl(offset) {
  const params = new URLSearchParams({
    where: WHERE_CLAUSE,
    outFields: '*',
    outSR: '4326',
    resultRecordCount: String(RECORD_COUNT),
    resultOffset: String(offset),
    f: 'json'
  });
  return `${BLM_ENDPOINT}?${params}`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('Fetching Arizona mining claims from BLM ArcGIS API…');

  const allClaims = [];
  let offset = 0;

  while (true) {
    let json;
    try {
      json = await fetchJson(buildUrl(offset));
    } catch (err) {
      console.error(`\nError fetching page at offset ${offset}: ${err.message}`);
      if (allClaims.length === 0) {
        console.error('No data fetched. Preserving any existing cached data.');
        process.exit(1);
      }
      console.warn('Partial fetch — saving what was retrieved so far.');
      break;
    }

    if (json.error) {
      const msg = json.error.message || JSON.stringify(json.error);
      console.error(`\nBLM API returned an error: ${msg}`);
      if (allClaims.length === 0) {
        process.exit(1);
      }
      break;
    }

    if (!Array.isArray(json.features)) {
      console.error('\nUnexpected response — no features array.');
      if (allClaims.length === 0) {
        process.exit(1);
      }
      break;
    }

    const page = json.features.map((f, i) =>
      mapBlmFeature(f.attributes || {}, f.geometry || null, offset + i)
    );
    allClaims.push(...page);
    console.log(`Fetched ${allClaims.length} claims…`);

    if (page.length < RECORD_COUNT) {
      break; // last page
    }
    offset += RECORD_COUNT;
  }

  const output = {
    metadata: {
      fetchedAt: new Date().toISOString(),
      totalRecords: allClaims.length,
      source: 'blm_arcgis'
    },
    data: allClaims
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');
  console.log(`\nSaved ${allClaims.length} claims to ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
