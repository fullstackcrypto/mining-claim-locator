-- scripts/setup_database.sql
-- PostgreSQL + PostGIS setup script for Mining Claim Locator
-- Operational schema for Arizona mining claims from BLM MLRS

-- Create database if it doesn't exist
-- Run this separately: CREATE DATABASE mining_claims;

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Drop tables if they exist (in correct order for foreign keys)
DROP TABLE IF EXISTS claim_history CASCADE;
DROP TABLE IF EXISTS claim_documents CASCADE;
DROP TABLE IF EXISTS claim_images CASCADE;
DROP TABLE IF EXISTS claim_source_links CASCADE;
DROP TABLE IF EXISTS mining_claims CASCADE;
DROP TABLE IF EXISTS data_refresh_logs CASCADE;

-- Main claims table (unified for all claim statuses)
CREATE TABLE mining_claims (
    id SERIAL PRIMARY KEY,
    
    -- BLM identifiers
    blm_case_id VARCHAR(50) UNIQUE NOT NULL,  -- e.g., AZMC123456
    claim_name VARCHAR(255),
    serial_number VARCHAR(50),
    
    -- Classification
    claim_type VARCHAR(50),  -- LODE, PLACER, MILLSITE, TUNNEL SITE
    case_disposition VARCHAR(50),  -- ACTIVE, CLOSED, ABANDONED, VOID
    
    -- Claimant information
    claimant_name VARCHAR(255),
    claimant_address TEXT,
    
    -- Location (PLSS - Public Land Survey System)
    state VARCHAR(2) DEFAULT 'AZ',
    county VARCHAR(100),
    township VARCHAR(20),
    range VARCHAR(20),
    section VARCHAR(20),
    meridian VARCHAR(50) DEFAULT 'GILA & SALT RIVER',
    
    -- Coordinates (derived or from BLM)
    latitude NUMERIC(10,6),
    longitude NUMERIC(10,6),
    geometry GEOMETRY(Geometry, 4326),
    
    -- Claim details
    acreage NUMERIC(10,2),
    commodity VARCHAR(255),
    
    -- Dates
    location_date DATE,
    recording_date DATE,
    close_date DATE,
    last_assessment_date DATE,
    
    -- Fee status
    maintenance_fee_paid BOOLEAN DEFAULT FALSE,
    last_fee_year INTEGER,
    
    -- Notes and descriptions
    notes TEXT,
    reason_closed TEXT,
    
    -- Data provenance (critical for operational system)
    source_system VARCHAR(100) NOT NULL DEFAULT 'MLRS',  -- MLRS, LR2000, MANUAL
    source_record_id VARCHAR(100),  -- Original ID in source system
    source_url VARCHAR(1024),  -- Link to official record
    source_retrieved_at TIMESTAMP,
    is_verified BOOLEAN DEFAULT FALSE,  -- Has been verified against source
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Claim history/events table
CREATE TABLE claim_history (
    id SERIAL PRIMARY KEY,
    claim_id INTEGER REFERENCES mining_claims(id) ON DELETE CASCADE,
    event_date DATE NOT NULL,
    event_type VARCHAR(100),  -- LOCATED, FEE_PAID, ASSESSMENT_FILED, CLOSED, etc.
    event_description TEXT,
    source_document VARCHAR(255),
    source_url VARCHAR(1024),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Claim documents table
CREATE TABLE claim_documents (
    id SERIAL PRIMARY KEY,
    claim_id INTEGER REFERENCES mining_claims(id) ON DELETE CASCADE,
    document_type VARCHAR(100),  -- LOCATION_NOTICE, PROOF_OF_LABOR, ASSESSMENT, etc.
    document_name VARCHAR(255),
    document_date DATE,
    document_url VARCHAR(1024),
    file_type VARCHAR(20),  -- PDF, TIF, JPG, etc.
    is_available BOOLEAN DEFAULT TRUE,
    source_system VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Claim images/maps table
CREATE TABLE claim_images (
    id SERIAL PRIMARY KEY,
    claim_id INTEGER REFERENCES mining_claims(id) ON DELETE CASCADE,
    image_type VARCHAR(100),  -- SITE_PHOTO, PLAT_MAP, SURVEY, etc.
    image_name VARCHAR(255),
    image_date DATE,
    image_url VARCHAR(1024),
    thumbnail_url VARCHAR(1024),
    source_system VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Source links table (external references)
CREATE TABLE claim_source_links (
    id SERIAL PRIMARY KEY,
    claim_id INTEGER REFERENCES mining_claims(id) ON DELETE CASCADE,
    link_type VARCHAR(100),  -- BLM_RECORD, COUNTY_RECORD, USGS, etc.
    link_name VARCHAR(255),
    link_url VARCHAR(1024) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    last_verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data refresh/ingestion logs
CREATE TABLE data_refresh_logs (
    id SERIAL PRIMARY KEY,
    source_system VARCHAR(100) NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(50),  -- RUNNING, COMPLETED, FAILED
    records_processed INTEGER DEFAULT 0,
    records_inserted INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_message TEXT,
    notes TEXT
);

-- Create spatial index
CREATE INDEX claims_geom_idx ON mining_claims USING GIST(geometry);

-- Create indices for common query fields
CREATE INDEX claims_state_idx ON mining_claims(state);
CREATE INDEX claims_county_idx ON mining_claims(county);
CREATE INDEX claims_township_range_idx ON mining_claims(township, range);
CREATE INDEX claims_disposition_idx ON mining_claims(case_disposition);
CREATE INDEX claims_type_idx ON mining_claims(claim_type);
CREATE INDEX claims_close_date_idx ON mining_claims(close_date);
CREATE INDEX claims_blm_case_idx ON mining_claims(blm_case_id);
CREATE INDEX claims_source_idx ON mining_claims(source_system);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
CREATE TRIGGER update_claims_timestamp 
BEFORE UPDATE ON mining_claims 
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

-- Function to create geometry from lat/lng
CREATE OR REPLACE FUNCTION update_geometry()
RETURNS TRIGGER AS $$
BEGIN
   IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
      NEW.geometry = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
   END IF;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-create geometry
CREATE TRIGGER claims_geometry_trigger
BEFORE INSERT OR UPDATE ON mining_claims
FOR EACH ROW EXECUTE PROCEDURE update_geometry();

-- View for API: claims with related counts
CREATE OR REPLACE VIEW claims_with_stats AS
SELECT 
    c.*,
    (SELECT COUNT(*) FROM claim_history h WHERE h.claim_id = c.id) as history_count,
    (SELECT COUNT(*) FROM claim_documents d WHERE d.claim_id = c.id) as document_count,
    (SELECT COUNT(*) FROM claim_images i WHERE i.claim_id = c.id) as image_count,
    (SELECT COUNT(*) FROM claim_source_links s WHERE s.claim_id = c.id) as source_link_count
FROM mining_claims c;

-- Insert Arizona sample data with proper source attribution
-- This is SAMPLE data for development - marked as unverified
INSERT INTO mining_claims (
    blm_case_id, claim_name, claim_type, claimant_name, case_disposition,
    location_date, close_date, county, township, range, section, meridian,
    latitude, longitude, acreage, commodity, maintenance_fee_paid,
    notes, reason_closed, source_system, is_verified
) VALUES 
(
    'AZMC123456', 'DESERT GOLD', 'LODE', 'ARIZONA MINERALS LLC', 'CLOSED',
    '1995-06-12', '2010-09-01', 'MARICOPA', 'T5N', 'R3E', '14', 'GILA & SALT RIVER',
    33.4484, -112.0740, 20.5, 'GOLD, SILVER', FALSE,
    'Sample claim for development purposes', 'Failure to pay maintenance fees',
    'SAMPLE', FALSE
),
(
    'AZMC789012', 'GOLDEN HORIZON', 'PLACER', 'SMITH MINING CO', 'ABANDONED',
    '2002-03-22', '2015-07-15', 'PIMA', 'T15S', 'R12E', '28', 'GILA & SALT RIVER',
    32.1234, -111.7890, 40.0, 'GOLD', FALSE,
    'Sample claim for development purposes', 'Abandoned by claimant',
    'SAMPLE', FALSE
),
(
    'AZMC345678', 'COPPER RIDGE', 'LODE', 'WESTERN COPPER INC', 'VOID',
    '1988-11-05', '1999-12-31', 'YAVAPAI', 'T12N', 'R1W', '7', 'GILA & SALT RIVER',
    34.5678, -112.4567, 20.0, 'COPPER', FALSE,
    'Sample claim for development purposes', 'Voided due to defective location',
    'SAMPLE', FALSE
);

-- Insert sample history
INSERT INTO claim_history (claim_id, event_date, event_type, event_description)
SELECT id, location_date, 'LOCATED', 'Claim located and recorded'
FROM mining_claims WHERE blm_case_id = 'AZMC123456';

INSERT INTO claim_history (claim_id, event_date, event_type, event_description)
SELECT id, '1996-09-01', 'FEE_PAID', 'Annual maintenance fee paid'
FROM mining_claims WHERE blm_case_id = 'AZMC123456';

INSERT INTO claim_history (claim_id, event_date, event_type, event_description)
SELECT id, close_date, 'CLOSED', 'Claim closed - maintenance fees not paid'
FROM mining_claims WHERE blm_case_id = 'AZMC123456';

-- Insert sample source links
INSERT INTO claim_source_links (claim_id, link_type, link_name, link_url, is_verified)
SELECT id, 'BLM_MLRS', 'BLM MLRS Record', 'https://mlrs.blm.gov/', FALSE
FROM mining_claims WHERE source_system = 'SAMPLE';

COMMENT ON TABLE mining_claims IS 'Main mining claims table - operational data from BLM MLRS. Check is_verified and source_system to determine data provenance.';
COMMENT ON COLUMN mining_claims.is_verified IS 'TRUE if this record has been verified against the official BLM source';
COMMENT ON COLUMN mining_claims.source_system IS 'Origin of this record: MLRS (official), LR2000 (legacy), SAMPLE (demo data), MANUAL (user entered)';
