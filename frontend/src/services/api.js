import CLAIMS, { CLAIMS_METADATA } from '../data/claims';
import COUNTIES from '../data/counties';

/**
 * Apply in-memory filtering to a claims array using the search params.
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
 * Build an informational notice about the dataset, if applicable.
 * Shows "Data last updated: …" when the pre-fetched BLM dataset is in use.
 */
function buildDataNotice() {
  if (!CLAIMS_METADATA) return null;
  if (CLAIMS.length <= 5) return null; // still on hardcoded samples

  if (CLAIMS_METADATA.source === 'blm_arcgis') {
    const ts = new Date(CLAIMS_METADATA.fetchedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    return `Data last updated: ${ts}`;
  }

  return null;
}

/**
 * Frontend API service.
 *
 * All data is pre-fetched at build time (see scripts/fetch_blm_data.js) and
 * embedded in frontend/src/data/blm_claims.json.  No runtime requests to
 * gis.blm.gov are made, which avoids CORS restrictions when served from
 * GitHub Pages.
 *
 * All functions return Promises resolving to `{ data, notice? }`.
 */
const api = {
  checkHealth: () => Promise.resolve({ data: { status: 'ok', timestamp: new Date() } }),

  getCounties: () => Promise.resolve({ data: COUNTIES }),

  searchClaims: (params = {}) => {
    const filtered = filterClaims(CLAIMS, params);
    const notice = buildDataNotice();
    return Promise.resolve(notice ? { data: filtered, notice } : { data: filtered });
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
