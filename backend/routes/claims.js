const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mining_claims'
});

// Check if database is available
let dbAvailable = false;
pool.query('SELECT 1')
  .then(() => {
    dbAvailable = true;
    console.log('Database connection established');
  })
  .catch(() => {
    console.log('Database not available, using sample data fallback');
  });

// Sample data fallback (used when database is not available)
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
    notes: 'Sample claim for development purposes',
    reason_closed: 'Failure to pay maintenance fees',
    source_system: 'SAMPLE',
    is_verified: false,
    history: [
      { event_date: '1995-06-12', event_type: 'LOCATED', event_description: 'Claim located and recorded' },
      { event_date: '1996-09-01', event_type: 'FEE_PAID', event_description: 'Annual maintenance fee paid' },
      { event_date: '2010-09-01', event_type: 'CLOSED', event_description: 'Claim closed - fees not paid' }
    ],
    documents: [],
    images: [],
    source_links: [
      { link_type: 'BLM_MLRS', link_name: 'BLM MLRS Record', link_url: 'https://mlrs.blm.gov/', is_verified: false }
    ]
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
    notes: 'Sample claim for development purposes',
    reason_closed: 'Abandoned by claimant',
    source_system: 'SAMPLE',
    is_verified: false,
    history: [
      { event_date: '2002-03-22', event_type: 'LOCATED', event_description: 'Claim located' },
      { event_date: '2015-07-15', event_type: 'ABANDONED', event_description: 'Claim abandoned' }
    ],
    documents: [],
    images: [],
    source_links: []
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
    notes: 'Sample claim for development purposes',
    reason_closed: 'Voided due to defective location',
    source_system: 'SAMPLE',
    is_verified: false,
    history: [
      { event_date: '1988-11-05', event_type: 'LOCATED', event_description: 'Claim located' },
      { event_date: '1999-12-31', event_type: 'VOID', event_description: 'Claim voided' }
    ],
    documents: [],
    images: [],
    source_links: [
      { link_type: 'BLM_MLRS', link_name: 'BLM MLRS Record', link_url: 'https://mlrs.blm.gov/', is_verified: false }
    ]
  }
];

// Search claims endpoint
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
      claimant,
      limit = 100,
      offset = 0
    } = req.query;

    // Try database first
    if (dbAvailable) {
      let query = `
        SELECT 
          id, blm_case_id, claim_name, claim_type, claimant_name, case_disposition,
          location_date, close_date, county, township, range, section, meridian,
          latitude, longitude, acreage, commodity, maintenance_fee_paid,
          notes, reason_closed, source_system, is_verified
        FROM mining_claims
        WHERE 1=1
      `;
      const params = [];
      let paramIndex = 1;

      if (county) {
        query += ` AND UPPER(county) = UPPER($${paramIndex++})`;
        params.push(county);
      }
      if (township) {
        query += ` AND UPPER(township) = UPPER($${paramIndex++})`;
        params.push(township);
      }
      if (range) {
        query += ` AND UPPER(range) = UPPER($${paramIndex++})`;
        params.push(range);
      }
      if (section) {
        query += ` AND section = $${paramIndex++}`;
        params.push(section);
      }
      if (claim_type) {
        query += ` AND UPPER(claim_type) = UPPER($${paramIndex++})`;
        params.push(claim_type);
      }
      if (case_disposition) {
        query += ` AND UPPER(case_disposition) = UPPER($${paramIndex++})`;
        params.push(case_disposition);
      }
      if (date_from) {
        query += ` AND close_date >= $${paramIndex++}`;
        params.push(date_from);
      }
      if (date_to) {
        query += ` AND close_date <= $${paramIndex++}`;
        params.push(date_to);
      }
      if (claimant) {
        query += ` AND UPPER(claimant_name) LIKE UPPER($${paramIndex++})`;
        params.push(`%${claimant}%`);
      }

      query += ` ORDER BY close_date DESC NULLS LAST LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(parseInt(limit, 10), parseInt(offset, 10));

      const result = await pool.query(query, params);
      return res.json(result.rows);
    }

    // Fallback to sample data
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
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
});

// Get claim details by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (dbAvailable) {
      // Get main claim data
      const claimResult = await pool.query(`
        SELECT * FROM mining_claims WHERE id = $1
      `, [id]);

      if (claimResult.rows.length === 0) {
        return res.status(404).json({ error: 'Claim not found' });
      }

      const claim = claimResult.rows[0];

      // Get history
      const historyResult = await pool.query(`
        SELECT event_date, event_type, event_description, source_document, source_url
        FROM claim_history 
        WHERE claim_id = $1 
        ORDER BY event_date ASC
      `, [id]);

      // Get documents
      const docsResult = await pool.query(`
        SELECT document_type, document_name, document_date, document_url, file_type, is_available
        FROM claim_documents 
        WHERE claim_id = $1 
        ORDER BY document_date DESC
      `, [id]);

      // Get images
      const imagesResult = await pool.query(`
        SELECT image_type, image_name, image_date, image_url, thumbnail_url
        FROM claim_images 
        WHERE claim_id = $1 
        ORDER BY image_date DESC
      `, [id]);

      // Get source links
      const linksResult = await pool.query(`
        SELECT link_type, link_name, link_url, is_verified
        FROM claim_source_links 
        WHERE claim_id = $1
      `, [id]);

      return res.json({
        ...claim,
        history: historyResult.rows,
        documents: docsResult.rows,
        images: imagesResult.rows,
        source_links: linksResult.rows
      });
    }

    // Fallback to sample data
    const claim = SAMPLE_CLAIMS.find(c => c.id === parseInt(id, 10));
    
    if (claim) {
      return res.json(claim);
    }
    
    return res.status(404).json({ error: 'Claim not found' });
  } catch (error) {
    console.error('Error fetching claim:', error);
    res.status(500).json({ error: 'Failed to fetch claim details', details: error.message });
  }
});

// Get claim history
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;

    if (dbAvailable) {
      const result = await pool.query(`
        SELECT event_date, event_type, event_description, source_document, source_url
        FROM claim_history 
        WHERE claim_id = $1 
        ORDER BY event_date ASC
      `, [id]);

      return res.json(result.rows);
    }

    // Fallback
    const claim = SAMPLE_CLAIMS.find(c => c.id === parseInt(id, 10));
    return res.json(claim?.history || []);
  } catch (error) {
    console.error('Error fetching claim history:', error);
    res.status(500).json({ error: 'Failed to fetch claim history' });
  }
});

// Get claim documents
router.get('/:id/documents', async (req, res) => {
  try {
    const { id } = req.params;

    if (dbAvailable) {
      const result = await pool.query(`
        SELECT document_type, document_name, document_date, document_url, file_type, is_available
        FROM claim_documents 
        WHERE claim_id = $1 
        ORDER BY document_date DESC
      `, [id]);

      return res.json(result.rows);
    }

    // Fallback
    const claim = SAMPLE_CLAIMS.find(c => c.id === parseInt(id, 10));
    return res.json(claim?.documents || []);
  } catch (error) {
    console.error('Error fetching claim documents:', error);
    res.status(500).json({ error: 'Failed to fetch claim documents' });
  }
});

// Get database stats
router.get('/stats/summary', async (req, res) => {
  try {
    if (dbAvailable) {
      const result = await pool.query(`
        SELECT 
          COUNT(*) as total_claims,
          COUNT(*) FILTER (WHERE case_disposition = 'CLOSED') as closed_claims,
          COUNT(*) FILTER (WHERE case_disposition = 'ABANDONED') as abandoned_claims,
          COUNT(*) FILTER (WHERE case_disposition = 'VOID') as void_claims,
          COUNT(*) FILTER (WHERE case_disposition = 'ACTIVE') as active_claims,
          COUNT(*) FILTER (WHERE is_verified = TRUE) as verified_claims,
          COUNT(*) FILTER (WHERE source_system = 'MLRS') as mlrs_sourced,
          COUNT(*) FILTER (WHERE source_system = 'SAMPLE') as sample_data,
          COUNT(DISTINCT county) as counties_covered
        FROM mining_claims
      `);

      return res.json({
        ...result.rows[0],
        database_connected: true
      });
    }

    return res.json({
      total_claims: SAMPLE_CLAIMS.length,
      closed_claims: SAMPLE_CLAIMS.filter(c => c.case_disposition === 'CLOSED').length,
      abandoned_claims: SAMPLE_CLAIMS.filter(c => c.case_disposition === 'ABANDONED').length,
      void_claims: SAMPLE_CLAIMS.filter(c => c.case_disposition === 'VOID').length,
      active_claims: 0,
      verified_claims: 0,
      mlrs_sourced: 0,
      sample_data: SAMPLE_CLAIMS.length,
      counties_covered: new Set(SAMPLE_CLAIMS.map(c => c.county)).size,
      database_connected: false
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
