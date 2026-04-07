const express = require('express');
const router = express.Router();

// NOTE: PostgreSQL pool is commented out until a real database is configured.
// When DATABASE_URL is set, uncomment this and implement database queries.
// const { Pool } = require('pg');
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mining_claims'
// });

// Rich sample data with full detail structure
const SAMPLE_CLAIMS = [
  {
    id: 1,
    blm_case_id: 'AZMC123456',
    claim_name: 'DESERT GOLD',
    claim_type: 'LODE',
    claimant_name: 'ARIZONA MINERALS LLC',
    case_disposition: 'CLOSED',
    location_date: '1995-06-12',
    close_date: '2010-09-01',
    county: 'MARICOPA',
    township: 'T5N',
    range: 'R3E',
    section: '14',
    meridian: 'GILA & SALT RIVER',
    latitude: 33.4484,
    longitude: -112.0740,
    acreage: 20.5,
    commodity: 'GOLD, SILVER',
    maintenance_fee_paid: false,
    notes: 'Claim closed due to failure to pay maintenance fees',
    history: [
      { date: '1995-06-12', event: 'Claim located' },
      { date: '1996-09-01', event: 'Annual maintenance fee paid' },
      { date: '2009-09-01', event: 'Final maintenance fee paid' },
      { date: '2010-09-01', event: 'Claim closed - fees not paid' }
    ],
    documents: [
      { name: 'Location Notice', type: 'PDF', url: null },
      { name: 'Proof of Labor 1996', type: 'PDF', url: null }
    ],
    images: [],
    source_links: [
      { name: 'BLM LR2000 Record', url: 'https://reports.blm.gov/reports.cfm?application=LR2000' }
    ],
    is_sample_data: true
  },
  {
    id: 2,
    blm_case_id: 'AZMC789012',
    claim_name: 'GOLDEN HORIZON',
    claim_type: 'PLACER',
    claimant_name: 'SMITH MINING CO',
    case_disposition: 'ABANDONED',
    location_date: '2002-03-22',
    close_date: '2015-07-15',
    county: 'PIMA',
    township: 'T15S',
    range: 'R12E',
    section: '28',
    meridian: 'GILA & SALT RIVER',
    latitude: 32.1234,
    longitude: -111.7890,
    acreage: 40.0,
    commodity: 'GOLD',
    maintenance_fee_paid: false,
    notes: 'Claim abandoned by claimant',
    history: [
      { date: '2002-03-22', event: 'Claim located' },
      { date: '2015-07-15', event: 'Claim abandoned' }
    ],
    documents: [],
    images: [],
    source_links: [],
    is_sample_data: true
  },
  {
    id: 3,
    blm_case_id: 'AZMC345678',
    claim_name: 'COPPER RIDGE',
    claim_type: 'LODE',
    claimant_name: 'WESTERN COPPER INC',
    case_disposition: 'VOID',
    location_date: '1988-11-05',
    close_date: '1999-12-31',
    county: 'YAVAPAI',
    township: 'T12N',
    range: 'R1W',
    section: '7',
    meridian: 'GILA & SALT RIVER',
    latitude: 34.5678,
    longitude: -112.4567,
    acreage: 20.0,
    commodity: 'COPPER',
    maintenance_fee_paid: false,
    notes: 'Claim voided due to defective location',
    history: [
      { date: '1988-11-05', event: 'Claim located' },
      { date: '1999-12-31', event: 'Claim voided' }
    ],
    documents: [
      { name: 'Original Location Notice', type: 'PDF', url: null }
    ],
    images: [
      { name: 'Site Photo 1989', url: null, thumbnail: null }
    ],
    source_links: [
      { name: 'BLM LR2000 Record', url: 'https://reports.blm.gov/reports.cfm?application=LR2000' }
    ],
    is_sample_data: true
  }
];

// Advanced search endpoint
router.get('/search', async (req, res) => {
  try {
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
    } = req.query;
    
    // For development, return sample data
    // Filter by query params if provided
    let results = [...SAMPLE_CLAIMS];
    
    if (county) {
      results = results.filter(c => c.county.toUpperCase() === county.toUpperCase());
    }
    if (claim_type) {
      results = results.filter(c => c.claim_type.toUpperCase() === claim_type.toUpperCase());
    }
    if (case_disposition) {
      results = results.filter(c => c.case_disposition.toUpperCase() === case_disposition.toUpperCase());
    }
    
    return res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// Get claim details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find in sample data
    const claim = SAMPLE_CLAIMS.find(c => c.id === parseInt(id, 10));
    
    if (claim) {
      return res.json(claim);
    }
    
    return res.status(404).json({ error: 'Claim not found' });
  } catch (error) {
    console.error('Error fetching claim:', error);
    res.status(500).json({ error: 'Database query failed' });
  }
});

module.exports = router;
