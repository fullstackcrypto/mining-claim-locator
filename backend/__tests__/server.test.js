const request = require('supertest');
const app = require('../server');

describe('Health endpoint', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});

describe('Counties endpoint', () => {
  it('GET /api/counties returns an array of 15 Arizona counties', async () => {
    const res = await request(app).get('/api/counties');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(15);
    expect(res.body).toContain('MARICOPA');
    expect(res.body).toContain('PIMA');
  });
});

describe('Claims search endpoint', () => {
  it('GET /api/claims/search returns all sample claims with no filters', async () => {
    const res = await request(app).get('/api/claims/search');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('filters by county', async () => {
    const res = await request(app).get('/api/claims/search?county=MARICOPA');
    expect(res.status).toBe(200);
    expect(res.body.every(c => c.county === 'MARICOPA')).toBe(true);
  });

  it('filters by claim_type', async () => {
    const res = await request(app).get('/api/claims/search?claim_type=PLACER');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every(c => c.claim_type === 'PLACER')).toBe(true);
  });

  it('filters by case_disposition', async () => {
    const res = await request(app).get('/api/claims/search?case_disposition=ABANDONED');
    expect(res.status).toBe(200);
    expect(res.body.every(c => c.case_disposition === 'ABANDONED')).toBe(true);
  });

  it('filters by claimant name (case-insensitive)', async () => {
    const res = await request(app).get('/api/claims/search?claimant=smith');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(
      res.body.every(c => c.claimant_name.toUpperCase().includes('SMITH'))
    ).toBe(true);
  });

  it('filters by date range', async () => {
    const res = await request(app).get(
      '/api/claims/search?date_from=2010-01-01&date_to=2020-12-31'
    );
    expect(res.status).toBe(200);
    expect(res.body.every(c => c.close_date >= '2010-01-01')).toBe(true);
    expect(res.body.every(c => c.close_date <= '2020-12-31')).toBe(true);
  });

  it('returns empty array when no claims match filter', async () => {
    const res = await request(app).get('/api/claims/search?county=NONEXISTENT');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('each claim has required fields', async () => {
    const res = await request(app).get('/api/claims/search');
    res.body.forEach(claim => {
      expect(claim).toHaveProperty('id');
      expect(claim).toHaveProperty('blm_case_id');
      expect(claim).toHaveProperty('claim_name');
      expect(claim).toHaveProperty('claim_type');
      expect(claim).toHaveProperty('claimant_name');
      expect(claim).toHaveProperty('case_disposition');
      expect(claim).toHaveProperty('county');
      expect(claim).toHaveProperty('latitude');
      expect(claim).toHaveProperty('longitude');
    });
  });
});

describe('Claim detail endpoint', () => {
  it('GET /api/claims/1 returns claim with id 1', async () => {
    const res = await request(app).get('/api/claims/1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
    expect(res.body.blm_case_id).toBe('AZMC123456');
  });

  it('GET /api/claims/9999 returns 404', async () => {
    const res = await request(app).get('/api/claims/9999');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Claim not found');
  });
});
