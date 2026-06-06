#!/usr/bin/env python3
"""
BLM Mining Claim Data Fetcher (Python version)

Retrieves and processes mining claim data from Bureau of Land Management
official open-data ArcGIS REST services for Arizona.

Data Sources (all open, public domain, no API key required):
  1. BLM NLSDB Mining Claims MapServer — Closed Mining Claims (Layer 2)
     Polygon geometry derived from PLSS legal land descriptions
  2. BLM HUB MLRS Mining Claims Closed — Recently modified claims
  3. BLM PLSS CadNSDI — Township/Range/Section grid reference

Usage:
  pip install -r requirements.txt
  python blm_fetcher.py [--output ../frontend/src/data/blm_claims.json]
"""

import os
import sys
import json
import time
import logging
import argparse
from datetime import datetime
from pathlib import Path

import requests
import pandas as pd

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.FileHandler("blm_fetcher.log"), logging.StreamHandler()]
)
logger = logging.getLogger("blm_fetcher")

# ---------------------------------------------------------------------------
# BLM ArcGIS REST endpoints (open public domain)
# ---------------------------------------------------------------------------

# Primary: NLSDB Mining Claims — Layer 2 = Closed Mining Claims
PRIMARY_ENDPOINT = (
    "https://gis.blm.gov/nlsdb/rest/services/"
    "Mining_Claims/MiningClaims/MapServer/2/query"
)

# Secondary: HUB Closed Claims (recently modified within last year)
SECONDARY_ENDPOINT = (
    "https://gis.blm.gov/nlsdb/rest/services/"
    "HUB/BLM_Natl_MLRS_Mining_Claims_Closed/MapServer/0/query"
)

# Active Mining Claims — Layer 1
ACTIVE_ENDPOINT = (
    "https://gis.blm.gov/nlsdb/rest/services/"
    "Mining_Claims/MiningClaims/MapServer/1/query"
)

ARIZONA_STATE_CODE = "AZ"
RECORD_COUNT = 2000
REQUEST_TIMEOUT = 45
DEFAULT_OUTPUT = Path(__file__).parent.parent / "frontend" / "src" / "data" / "blm_claims.json"


class BLMDataFetcher:
    """Handles retrieval of BLM mining claim data from official open-data services."""

    def __init__(self, output_path=None):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'MiningClaimLocator/2.0 (open-source research tool)'
        })
        self.output_path = Path(output_path) if output_path else DEFAULT_OUTPUT
        self.primary_records = []
        self.secondary_records = []

    def fetch_paginated(self, endpoint, where_clause, label="source"):
        """Fetch all records from a BLM ArcGIS endpoint with pagination."""
        logger.info(f"[{label}] Fetching from: {endpoint}")
        logger.info(f"[{label}] WHERE: {where_clause}")

        all_features = []
        offset = 0

        while True:
            params = {
                'where': where_clause,
                'outFields': '*',
                'outSR': '4326',
                'returnGeometry': 'true',
                'resultRecordCount': RECORD_COUNT,
                'resultOffset': offset,
                'f': 'json'
            }

            try:
                response = self.session.get(
                    endpoint, params=params, timeout=REQUEST_TIMEOUT
                )
                response.raise_for_status()
                data = response.json()
            except requests.exceptions.RequestException as e:
                logger.error(f"[{label}] Request error at offset {offset}: {e}")
                if not all_features:
                    raise
                logger.warning(f"[{label}] Partial fetch — returning {len(all_features)} records")
                break
            except json.JSONDecodeError as e:
                logger.error(f"[{label}] JSON decode error: {e}")
                if not all_features:
                    raise
                break

            if 'error' in data:
                msg = data['error'].get('message', str(data['error']))
                logger.error(f"[{label}] API error: {msg}")
                if not all_features:
                    raise RuntimeError(f"{label}: API error — {msg}")
                break

            features = data.get('features', [])
            if not isinstance(features, list):
                logger.error(f"[{label}] Unexpected response format")
                if not all_features:
                    raise RuntimeError(f"{label}: No features in response")
                break

            all_features.extend(features)
            logger.info(f"[{label}] Fetched {len(all_features)} records so far…")

            if len(features) < RECORD_COUNT:
                break  # last page

            offset += RECORD_COUNT
            time.sleep(0.5)  # Rate limiting

        return all_features

    def map_nlsdb_feature(self, attrs, geometry, index):
        """Map NLSDB feature attributes to app schema."""
        # Compute centroid from polygon geometry
        lat, lng = None, None
        if geometry and 'rings' in geometry and geometry['rings']:
            ring = geometry['rings'][0]
            if ring:
                xs = [p[0] for p in ring]
                ys = [p[1] for p in ring]
                lng = sum(xs) / len(xs)
                lat = sum(ys) / len(ys)

        # Parse case metadata
        meta = {}
        cse_meta = attrs.get('CSE_META', '')
        if cse_meta:
            try:
                meta = json.loads(cse_meta)
            except (json.JSONDecodeError, TypeError):
                pass

        def format_date(raw):
            if not raw:
                return None
            if isinstance(raw, (int, float)):
                try:
                    return datetime.fromtimestamp(raw / 1000).strftime('%Y-%m-%d')
                except (ValueError, OSError):
                    return None
            return str(raw)[:10]

        def map_claim_type(prod, type_nr):
            if prod:
                p = prod.upper()
                if 'LODE' in p:
                    return 'LODE'
                if 'PLACER' in p:
                    return 'PLACER'
                if 'TUNNEL' in p:
                    return 'TUNNEL SITE'
                if 'MILL' in p:
                    return 'MILLSITE'
            if type_nr:
                t = str(type_nr)
                if t.startswith('3841'):
                    return 'LODE'
                if t.startswith('3842'):
                    return 'PLACER'
                if t.startswith('3843'):
                    return 'TUNNEL SITE'
                if t.startswith('3844'):
                    return 'MILLSITE'
            return 'LODE'

        return {
            'id': attrs.get('OBJECTID', index),
            'blm_case_id': attrs.get('CSE_NR', '') or attrs.get('LEG_CSE_NR', ''),
            'claim_name': attrs.get('CSE_NAME', ''),
            'claim_type': map_claim_type(attrs.get('BLM_PROD'), attrs.get('CSE_TYPE_NR')),
            'claimant_name': meta.get('claimant', '') or meta.get('CLAIMANT', ''),
            'case_disposition': (attrs.get('CSE_DISP', '') or '').upper(),
            'location_date': format_date(meta.get('location_date') or meta.get('LOC_DATE')),
            'close_date': format_date(meta.get('close_date') or meta.get('CLOSE_DATE')),
            'county': (meta.get('county', '') or meta.get('COUNTY', '') or '').upper(),
            'township': meta.get('township', '') or meta.get('TOWNSHIP', '') or meta.get('TWP', ''),
            'range': meta.get('range', '') or meta.get('RANGE', '') or meta.get('RNG', ''),
            'section': str(meta.get('section', '') or meta.get('SECTION', '') or ''),
            'meridian': meta.get('meridian', 'GILA & SALT RIVER'),
            'latitude': round(lat, 6) if lat else None,
            'longitude': round(lng, 6) if lng else None,
            'acreage': float(attrs['RCRD_ACRS']) if attrs.get('RCRD_ACRS') else None,
            'commodity': meta.get('commodity', '') or meta.get('COMMODITY', ''),
            'maintenance_fee_paid': False,
            'notes': None,
            'data_quality': attrs.get('QLTY'),
            'patented': attrs.get('MC_PATENTED') == 'Y',
            'source': 'blm_nlsdb'
        }

    def fetch_closed_claims(self):
        """Fetch closed/abandoned/void claims from primary NLSDB source."""
        where = f"ADMIN_STATE='{ARIZONA_STATE_CODE}' AND CSE_DISP IN ('CLOSED','ABANDONED','VOID')"
        features = self.fetch_paginated(PRIMARY_ENDPOINT, where, "NLSDB-Primary")
        self.primary_records = [
            self.map_nlsdb_feature(f.get('attributes', {}), f.get('geometry'), i)
            for i, f in enumerate(features)
        ]
        logger.info(f"Primary source: {len(self.primary_records)} records mapped")
        return self.primary_records

    def fetch_recently_closed(self):
        """Fetch recently closed claims from secondary HUB source."""
        where = f"ADMIN_STATE='{ARIZONA_STATE_CODE}'"
        try:
            features = self.fetch_paginated(SECONDARY_ENDPOINT, where, "HUB-Secondary")
            self.secondary_records = [
                self.map_nlsdb_feature(f.get('attributes', {}), f.get('geometry'), i)
                for i, f in enumerate(features)
            ]
            for rec in self.secondary_records:
                rec['source'] = 'blm_hub_closed'
            logger.info(f"Secondary source: {len(self.secondary_records)} records mapped")
        except Exception as e:
            logger.warning(f"Secondary source failed (non-fatal): {e}")
            self.secondary_records = []
        return self.secondary_records

    def deduplicate_and_merge(self):
        """Merge primary and secondary records, deduplicating by case number."""
        seen = set()
        merged = []

        # Primary records take priority
        for rec in self.primary_records:
            case_id = rec['blm_case_id']
            if case_id and case_id not in seen:
                seen.add(case_id)
                merged.append(rec)
            elif not case_id:
                merged.append(rec)

        # Add secondary records not already present
        for rec in self.secondary_records:
            case_id = rec['blm_case_id']
            if case_id and case_id not in seen:
                seen.add(case_id)
                merged.append(rec)

        logger.info(f"After deduplication: {len(merged)} unique claims")
        return merged

    def save_output(self, claims):
        """Save claims data to JSON file."""
        output = {
            'metadata': {
                'fetchedAt': datetime.utcnow().isoformat() + 'Z',
                'totalRecords': len(claims),
                'source': 'blm_arcgis',
                'sources': [
                    {
                        'name': 'BLM NLSDB Mining Claims (Closed)',
                        'url': 'https://gis.blm.gov/nlsdb/rest/services/Mining_Claims/MiningClaims/MapServer/2',
                        'records': len(self.primary_records),
                        'description': 'Official BLM MLRS — closed mining claims with polygon geometry'
                    },
                    {
                        'name': 'BLM HUB MLRS Mining Claims Closed',
                        'url': 'https://gis.blm.gov/nlsdb/rest/services/HUB/BLM_Natl_MLRS_Mining_Claims_Closed/MapServer/0',
                        'records': len(self.secondary_records),
                        'description': 'Recently updated/modified closed claims from BLM GBP Hub'
                    }
                ],
                'dataLicense': 'U.S. Public Domain — U.S. Department of Interior, Bureau of Land Management',
                'notes': 'Geometry derived from PLSS legal land descriptions. Data quality scores indicate mapping confidence.'
            },
            'data': claims
        }

        self.output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.output_path, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)

        logger.info(f"Saved {len(claims)} claims to {self.output_path}")

    def run_full_pipeline(self):
        """Run the complete data fetching and processing pipeline."""
        logger.info("=" * 60)
        logger.info("BLM Mining Claims Data Pipeline — Starting")
        logger.info(f"Timestamp: {datetime.utcnow().isoformat()}Z")
        logger.info("=" * 60)

        # Fetch from both sources
        self.fetch_closed_claims()
        self.fetch_recently_closed()

        # Merge and deduplicate
        claims = self.deduplicate_and_merge()

        if not claims:
            logger.error("No claims fetched from any source. Preserving existing data.")
            sys.exit(1)

        # Save output
        self.save_output(claims)

        logger.info("=" * 60)
        logger.info("Pipeline complete")
        logger.info(f"  Primary: {len(self.primary_records)} records")
        logger.info(f"  Secondary: {len(self.secondary_records)} records")
        logger.info(f"  Final: {len(claims)} unique claims")
        logger.info("=" * 60)

        return claims


def main():
    parser = argparse.ArgumentParser(
        description='Fetch BLM mining claim data for Arizona'
    )
    parser.add_argument(
        '--output', '-o',
        default=str(DEFAULT_OUTPUT),
        help='Output JSON file path'
    )
    args = parser.parse_args()

    fetcher = BLMDataFetcher(output_path=args.output)
    fetcher.run_full_pipeline()


if __name__ == "__main__":
    main()
