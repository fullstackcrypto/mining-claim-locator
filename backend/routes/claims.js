const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mining_claims'
});

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
    return res.json([
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
        maintenance_fee_paid: false
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
        maintenance_fee_paid: false
      }
    ]);    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// Get claim details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // For development, return sample data
    return res.json({
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
      maintenance_fee_paid: false,
      commodity: 'GOLD, SILVER',
      notes: 'Claim abandoned due to failure to pay maintenance fees'
    });
  } catch (error) {
    console.error('Error fetching claim:', error);
    res.status(500).json({ error: 'Database query failed' });
  }
});

module.exports = router;
