const express = require('express');
const router = express.Router();

// Sample data – used when no database is configured.
// Real deployments should replace this with database queries (see setup_database.sql).
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
    notes: 'Claim abandoned due to failure to pay maintenance fees'
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
    notes: null
  },
  {
    id: 3,
    blm_case_id: 'AZMC345678',
    claim_name: 'SILVER RIDGE',
    claim_type: 'LODE',
    claimant_name: 'JONES PROSPECTING LLC',
    case_disposition: 'VOID',
    location_date: '1988-11-05',
    close_date: '2000-01-15',
    county: 'YAVAPAI',
    township: 'T13N',
    range: 'R4W',
    section: '7',
    meridian: 'GILA & SALT RIVER',
    latitude: 34.5400,
    longitude: -112.4685,
    acreage: 20.0,
    commodity: 'SILVER, LEAD',
    maintenance_fee_paid: false,
    notes: null
  },
  {
    id: 4,
    blm_case_id: 'AZMC901234',
    claim_name: 'COPPER QUEEN',
    claim_type: 'LODE',
    claimant_name: 'DESERT METALS INC',
    case_disposition: 'CLOSED',
    location_date: '1972-04-18',
    close_date: '1995-06-30',
    county: 'COCHISE',
    township: 'T24S',
    range: 'R25E',
    section: '3',
    meridian: 'GILA & SALT RIVER',
    latitude: 31.4404,
    longitude: -109.9218,
    acreage: 20.0,
    commodity: 'COPPER',
    maintenance_fee_paid: false,
    notes: null
  },
  {
    id: 5,
    blm_case_id: 'AZMC567890',
    claim_name: 'TURQUOISE HILLS',
    claim_type: 'PLACER',
    claimant_name: 'SOUTHWEST GEM HUNTERS',
    case_disposition: 'ABANDONED',
    location_date: '2005-08-30',
    close_date: '2018-11-01',
    county: 'MOHAVE',
    township: 'T22N',
    range: 'R18W',
    section: '22',
    meridian: 'GILA & SALT RIVER',
    latitude: 35.1894,
    longitude: -114.0553,
    acreage: 160.0,
    commodity: 'TURQUOISE',
    maintenance_fee_paid: false,
    notes: null
  }
];

/**
 * Search claims with optional filters.
 * Query parameters: county, township, range, section, claim_type,
 *                   case_disposition, date_from, date_to, claimant
 */
router.get('/search', (req, res) => {
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

    let results = SAMPLE_CLAIMS.slice();

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

    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

/**
 * Get a single claim by id.
 */
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const claim = SAMPLE_CLAIMS.find(c => c.id === id);
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    res.json(claim);
  } catch (error) {
    console.error('Error fetching claim:', error);
    res.status(500).json({ error: 'Request failed' });
  }
});

module.exports = router;
