# Mining Claim Locator

An operational application for researching expired and abandoned mining claims in Arizona using BLM MLRS data.

## Current Status

**Architecture:** Operational (database-backed with sample data fallback)  
**Coverage:** Arizona (first production target)  
**Data Source:** BLM Mineral & Land Records System (MLRS)

### Data Provenance

| Source System | Description | Verification |
|---------------|-------------|--------------|
| `MLRS` | Official BLM MLRS records | ✓ Source-backed |
| `LR2000` | Legacy BLM system records | ✓ Source-backed |
| `SAMPLE` | Demo/development data | ✗ Not verified |
| `MANUAL` | User-entered records | ✗ Not verified |

The application clearly distinguishes between verified source-backed data and sample/demo data in both the UI and API responses via the `source_system` and `is_verified` fields.

## Features

- **Real-time claim search** — Query by county, township/range/section, claim type, disposition, date range
- **Interactive map visualization** — Google Maps with marker clustering for large datasets
- **Rich claim details** — Tabbed panel with overview, history, documents, images, and source links
- **Data provenance tracking** — Every record shows its source system and verification status
- **Responsive design** — Desktop sidebar panel, mobile full-screen modal
- **Graceful degradation** — Falls back to sample data when database is unavailable

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│         React + Google Maps (GitHub Pages)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend API                            │
│              Express.js (Render/Railway/Fly)                │
│                                                             │
│  GET /api/health              GET /api/counties             │
│  GET /api/claims/search       GET /api/claims/:id           │
│  GET /api/claims/:id/history  GET /api/claims/:id/documents │
│  GET /api/claims/stats/summary                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database                               │
│              PostgreSQL + PostGIS                           │
│                                                             │
│  mining_claims        claim_history       claim_documents   │
│  claim_images         claim_source_links  data_refresh_logs │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Data Ingestion                            │
│         Python scripts (MLRS scraper/parser)                │
└─────────────────────────────────────────────────────────────┘
```

## Deploying from GitHub

### 1. Enable GitHub Pages (Frontend)
In your repository go to **Settings → Pages → Source** and select **GitHub Actions**.

### 2. Set GitHub Secrets / Variables
| Name | Where | Purpose |
|------|-------|---------|
| `GOOGLE_MAPS_API_KEY` | Repository **Secret** | Enables the interactive map |
| `API_URL` | Repository **Variable** | Backend API URL (e.g. `https://my-api.onrender.com/api`) |

### 3. Deploy Backend to Render
1. Sign up at <https://render.com> and connect your GitHub repository
2. Render will detect `render.yaml` and create a **Web Service** automatically
3. Add a **PostgreSQL** database from the Render dashboard
4. Set environment variables:
   - `DATABASE_URL` — Render provides this when you attach the database
   - `ALLOWED_ORIGINS` — Your GitHub Pages URL (e.g. `https://user.github.io`)
5. Run the database setup: `psql $DATABASE_URL < scripts/setup_database.sql`

### 4. (Optional) Load Real Data
Run the MLRS data ingestion script to populate the database with real Arizona claims:
```bash
cd scripts
pip install -r requirements.txt
python blm_fetcher.py --state AZ --output postgres
```

## Local Development

```bash
# Backend (runs on http://localhost:3000)
cd backend && npm install && node server.js

# Frontend (runs on http://localhost:3000 by default, or 3001 if 3000 is in use)
cd frontend && npm install && npm start

# Database (PostgreSQL with PostGIS)
psql -c "CREATE DATABASE mining_claims;"
psql -d mining_claims -f scripts/setup_database.sql
```

Copy `frontend/.env.example` to `frontend/.env` and fill in your values before starting the frontend.

## API Reference

### GET /api/claims/search
Search for mining claims with optional filters.

**Query Parameters:**
- `county` — Filter by Arizona county
- `township` — Filter by township (e.g., T5N)
- `range` — Filter by range (e.g., R3E)
- `section` — Filter by section number
- `claim_type` — LODE, PLACER, MILLSITE, TUNNEL SITE
- `case_disposition` — ACTIVE, CLOSED, ABANDONED, VOID
- `date_from` / `date_to` — Filter by close date range
- `claimant` — Search by claimant name (partial match)
- `limit` / `offset` — Pagination (default: 100 records)

### GET /api/claims/:id
Get full claim details including history, documents, images, and source links.

### GET /api/claims/stats/summary
Get database statistics and coverage information.

## Technologies

- **Frontend:** React, Google Maps JavaScript API
- **Backend:** Node.js, Express
- **Database:** PostgreSQL, PostGIS
- **Data Sources:** BLM MLRS, BLM LR2000 (legacy)
- **CI/CD:** GitHub Actions → GitHub Pages (frontend), Render (backend)

## Limitations

- **Geographic Coverage:** Currently Arizona only (expanding)
- **Data Currency:** Depends on ingestion frequency; check `data_refresh_logs`
- **Verification:** Only `MLRS` and `LR2000` sourced records are verified
- **Documents/Images:** Many historical documents are not digitized

