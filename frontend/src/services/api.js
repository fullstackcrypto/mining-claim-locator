import CLAIMS from '../data/claims';
import COUNTIES from '../data/counties';

/**
 * Replicates the backend filtering logic from backend/routes/claims.js so the
 * frontend is fully self-contained and can be deployed to GitHub Pages without
 * a running server.
 *
 * Each function returns a Promise that resolves to `{ data: <value> }` so all
 * existing call sites (which expect axios-shaped responses) work unchanged.
 */
const api = {
  checkHealth: () => Promise.resolve({ data: { status: 'ok', timestamp: new Date() } }),

  getCounties: () => Promise.resolve({ data: COUNTIES }),

  searchClaims: (params = {}) => {
    const {
      county,
      township,
      range,
      section,
      claim_type,
      case_disposition,
      date_from,
      date_to,
      claimant
    } = params;

    let results = CLAIMS.slice();

    if (county) {
      results = results.filter(c => c.county === county.toUpperCase());
    }
    if (township) {
      results = results.filter(c =>
        c.township.toUpperCase().includes(township.toUpperCase())
      );
    }
    if (range) {
      results = results.filter(c =>
        c.range.toUpperCase().includes(range.toUpperCase())
      );
    }
    if (section) {
      results = results.filter(c => c.section === section);
    }
    if (claim_type) {
      results = results.filter(c => c.claim_type === claim_type.toUpperCase());
    }
    if (case_disposition) {
      results = results.filter(
        c => c.case_disposition === case_disposition.toUpperCase()
      );
    }
    if (date_from) {
      results = results.filter(c => c.close_date >= date_from);
    }
    if (date_to) {
      results = results.filter(c => c.close_date <= date_to);
    }
    if (claimant) {
      results = results.filter(c =>
        c.claimant_name.toUpperCase().includes(claimant.toUpperCase())
      );
    }

    return Promise.resolve({ data: results });
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
