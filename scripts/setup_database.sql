-- scripts/setup_database.sql
-- PostgreSQL setup script for Mining Claim Locator

-- Create database if it doesn't exist
-- Run this separately: CREATE DATABASE mining_claims;

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Drop tables if they exist
DROP TABLE IF EXISTS expired_mining_claims;
DROP TABLE IF EXISTS active_mining_claims;
DROP TABLE IF EXISTS historical_claims;
DROP TABLE IF EXISTS claim_documents;
DROP TABLE IF EXISTS data_refresh_logs;

-- Create table for expired mining claims
CREATE TABLE expired_mining_claims (
    id SERIAL PRIMARY KEY,
    claim_id VARCHAR(50) UNIQUE NOT NULL,
    claim_name VARCHAR(255),
    claim_type VARCHAR(50),
    claimant VARCHAR(255),
    location_date DATE,
    expiration_date DATE,
    close_date DATE,
    county VARCHAR(100),
    township VARCHAR(20),
    range VARCHAR(20),
    section VARCHAR(20),
    meridian VARCHAR(50),
    state VARCHAR(2) DEFAULT 'AZ',
    acres NUMERIC(10,2),
    commodity VARCHAR(255),
    status VARCHAR(50),
    reason_expired TEXT,
    geometry GEOMETRY(Geometry, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create table for active mining claims
CREATE TABLE active_mining_claims (
    id SERIAL PRIMARY KEY,
    claim_id VARCHAR(50) UNIQUE NOT NULL,
    claim_name VARCHAR(255),
    claim_type VARCHAR(50),
    claimant VARCHAR(255),
    location_date DATE,
    last_assessment_date DATE,
    county VARCHAR(100),
    township VARCHAR(20),
    range VARCHAR(20),
    section VARCHAR(20),
    meridian VARCHAR(50),
    state VARCHAR(2) DEFAULT 'AZ',
    acres NUMERIC(10,2),
    commodity VARCHAR(255),
    status VARCHAR(50),
    geometry GEOMETRY(Geometry, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create table for historical claims
CREATE TABLE historical_claims (
    id SERIAL PRIMARY KEY,
    claim_id VARCHAR(50),
    claim_name VARCHAR(255),
    claim_type VARCHAR(50),
    claimant VARCHAR(255),
    location_date DATE,
    close_date DATE,
    county VARCHAR(100),
    township VARCHAR(20),
    range VARCHAR(20),
    section VARCHAR(20),
    meridian VARCHAR(50),
    state VARCHAR(2) DEFAULT 'AZ',
    source VARCHAR(255),
    source_date DATE,
    notes TEXT,
    geometry GEOMETRY(Geometry, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create table for claim documents
CREATE TABLE claim_documents (
    id SERIAL PRIMARY KEY,
    claim_id VARCHAR(50) REFERENCES expired_mining_claims(claim_id),
    document_type VARCHAR(100),
    document_date DATE,
    document_url VARCHAR(1024),
    document_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create table for data refresh logs
CREATE TABLE data_refresh_logs (
    id SERIAL PRIMARY KEY,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(50),
    records_processed INTEGER,
    new_records INTEGER,
    updated_records INTEGER,
    error_message TEXT,
    source VARCHAR(255)
);

-- Create spatial indices
CREATE INDEX expired_claims_geom_idx ON expired_mining_claims USING GIST(geometry);
CREATE INDEX active_claims_geom_idx ON active_mining_claims USING GIST(geometry);
CREATE INDEX historical_claims_geom_idx ON historical_claims USING GIST(geometry);

-- Create indices for common query fields
CREATE INDEX expired_claims_county_idx ON expired_mining_claims(county);
CREATE INDEX expired_claims_township_range_idx ON expired_mining_claims(township, range);
CREATE INDEX expired_claims_expiration_idx ON expired_mining_claims(expiration_date);
CREATE INDEX active_claims_county_idx ON active_mining_claims(county);

-- Create view for all claims (active and expired)
CREATE OR REPLACE VIEW all_mining_claims AS
SELECT 
    claim_id, 
    claim_name, 
    claim_type, 
    claimant, 
    location_date, 
    county, 
    township, 
    range, 
    section, 
    'active' AS status, 
    geometry 
FROM 
    active_mining_claims
UNION ALL
SELECT 
    claim_id, 
    claim_name, 
    claim_type, 
    claimant, 
    location_date, 
    county, 
    township, 
    range, 
    section, 
    'expired' AS status, 
    geometry 
FROM 
    expired_mining_claims;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at timestamps
CREATE TRIGGER update_expired_claims_timestamp 
BEFORE UPDATE ON expired_mining_claims 
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_active_claims_timestamp 
BEFORE UPDATE ON active_mining_claims 
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

-- Sample data for testing (optional)
INSERT INTO expired_mining_claims (
    claim_id, claim_name, claim_type, claimant, location_date, 
    expiration_date, county, township, range, section, 
    status, reason_expired, geometry
) VALUES (
    'AMC123456', 'SAMPLE CLAIM', 'LODE', 'JOHN DOE', '1995-05-15', 
    '2005-09-01', 'MARICOPA', 'T5N', 'R3E', '14', 
    'CLOSED', 'FAILURE TO PAY MAINTENANCE FEE', 
    ST_GeomFromText('POINT(-112.0740 33.4484)', 4326)
);
