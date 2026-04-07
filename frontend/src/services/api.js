import CLAIMS from '../data/claims';
import COUNTIES from '../data/counties';

/**
 * BLM ArcGIS REST API endpoint for mining claims.
 * Queried at runtime for live data; falls back to embedded static data on failure.
 */
const BLM_ENDPOINT =
  'https://gis.blm.gov/arcgis/rest/services/mining/BLM_Natl_Mining_Claims/MapServer/0/query';

const FALLBACK_NOTICE =
  'Live BLM data is currently unavailable. Showing cached sample records. ' +
  'Real-time data from gis.blm.gov could not be reached.';

/**
 * Map BLM ArcGIS field names to the application's field names.
 * @param {Object} attrs - Feature attributes from ArcGIS response
 * @param {Object} geometry - Feature geometry (point) from ArcGIS response
 * @param {number} index - Used as a fallback id
 * @returns {Object} Normalized claim object
 */
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

/**
 * Build a WHERE clause for the BLM ArcGIS query based on the search params.
 * Always restricts to Arizona and expired/abandoned/void claims.
 */
function buildWhereClause(params = {}) {
  const conditions = ["STATE_ABBR='AZ'", "CASE_DISP IN ('CLOSED','ABANDONED','VOID')"];

  if (params.county) {
    const county = params.county.toUpperCase().replace(/'/g, "''");
    conditions.push(`UPPER(COUNTY) = '${county}'`);
  }
  if (params.case_disposition) {
    const disp = params.case_disposition.toUpperCase().replace(/'/g, "''");
    conditions.push(`CASE_DISP = '${disp}'`);
  }
  if (params.claim_type) {
    const ct = params.claim_type.toUpperCase().replace(/'/g, "''");
    conditions.push(`UPPER(CASE_TYPE) = '${ct}'`);
  }
  if (params.claimant) {
    const claimant = params.claimant.toUpperCase().replace(/'/g, "''");
    conditions.push(`UPPER(CLAIMANT) LIKE '%${claimant}%'`);
  }

  return conditions.join(' AND ');
}

/**
 * Fetch claims from the BLM ArcGIS REST API.
 * Retrieves up to 1 000 features per request.
 * Returns null if the request fails (CORS, timeout, server error, etc.).
 */
async function fetchFromBlm(params = {}) {
  const query = new URLSearchParams({
    where: buildWhereClause(params),
    outFields: '*',
    outSR: '4326',
    resultRecordCount: '1000',
    f: 'json'
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${BLM_ENDPOINT}?${query}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const json = await res.json();
    if (!json || !Array.isArray(json.features)) return null;

    return json.features.map((f, i) =>
      mapBlmFeature(f.attributes || {}, f.geometry || null, i)
    );
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

/**
 * Apply in-memory filtering to a claims array using the search params.
 * Used for both the static fallback and for params not pushed to BLM WHERE clause.
 */
function filterClaims(claims, params = {}) {
  let results = claims.slice();

  if (params.county) {
    results = results.filter(c => c.county === params.county.toUpperCase());
  }
  if (params.township) {
    results = results.filter(c =>
      c.township.toUpperCase().includes(params.township.toUpperCase())
    );
  }
  if (params.range) {
    results = results.filter(c =>
      c.range.toUpperCase().includes(params.range.toUpperCase())
    );
  }
  if (params.section) {
    results = results.filter(c => c.section === params.section);
  }
  if (params.claim_type) {
    results = results.filter(c => c.claim_type === params.claim_type.toUpperCase());
  }
  if (params.case_disposition) {
    results = results.filter(
      c => c.case_disposition === params.case_disposition.toUpperCase()
    );
  }
  if (params.date_from) {
    results = results.filter(c => c.close_date && c.close_date >= params.date_from);
  }
  if (params.date_to) {
    results = results.filter(c => c.close_date && c.close_date <= params.date_to);
  }
  if (params.claimant) {
    results = results.filter(c =>
      c.claimant_name &&
      c.claimant_name.toUpperCase().includes(params.claimant.toUpperCase())
    );
  }

  return results;
}

/**
 * Frontend API service.
 *
 * searchClaims() first attempts to query the live BLM ArcGIS REST API.
 * If that fails (CORS, downtime, timeout), it falls back to the embedded
 * static dataset and attaches a `notice` field to the response.
 *
 * All functions return Promises resolving to `{ data, notice? }` so existing
 * call sites (which expect axios-shaped responses) work unchanged.
 */
const api = {
  checkHealth: () => Promise.resolve({ data: { status: 'ok', timestamp: new Date() } }),

  getCounties: () => Promise.resolve({ data: COUNTIES }),

  searchClaims: async (params = {}) => {
    // Try live BLM data
    const liveData = await fetchFromBlm(params);

    if (liveData !== null) {
      // Apply remaining in-memory filters (township, range, section, date range)
      const filtered = filterClaims(liveData, {
        township: params.township,
        range: params.range,
        section: params.section,
        date_from: params.date_from,
        date_to: params.date_to
      });
      return { data: filtered };
    }

    // Fallback: embedded static data
    const filtered = filterClaims(CLAIMS, params);
    return { data: filtered, notice: FALLBACK_NOTICE };
  },

  getClaimDetails: (id) => {
    const claim = CLAIMS.find(c => c.id === parseInt(id, 10));
    if (!claim) {
      return Promise.reject(new Error('Claim not found'));
    }
    return Promise.resolve({ data: claim });
  }
};

export default api;
