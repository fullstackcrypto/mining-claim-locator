# Mining Claim Locator

An interactive web application for locating expired and abandoned mining claims in Arizona using official BLM (Bureau of Land Management) open-data services, powered by Mapbox GL JS.

## What this app does

The Mining Claim Locator helps prospectors, researchers, and land enthusiasts find expired, abandoned, and void mining claims across Arizona. It pulls data directly from the **official BLM NLSDB and MLRS** open-data ArcGIS REST services — the same authoritative source used by the federal government — and presents it on an interactive Mapbox-powered map with BLM overlay layers.

### Data Sources (Open, Public Domain)

| Source | Endpoint | Description |
|--------|----------|-------------|
| **BLM NLSDB Mining Claims** | [MapServer/2](https://gis.blm.gov/nlsdb/rest/services/Mining_Claims/MiningClaims/MapServer/2) | Closed mining claims with polygon geometry derived from PLSS |
| **BLM HUB MLRS Closed** | [MapServer/0](https://gis.blm.gov/nlsdb/rest/services/HUB/BLM_Natl_MLRS_Mining_Claims_Closed/MapServer/0) | Recently updated/modified closed claims |
| **BLM PLSS CadNSDI** | [MapServer](https://gis.blm.gov/arcgis/rest/services/Cadastral/BLM_Natl_PLSS_CadNSDI/MapServer) | Township/Range/Section grid overlay |
| **BLM Surface Management** | [MapServer](https://gis.blm.gov/arcgis/rest/services/admin_boundaries/BLM_Natl_SMA_LimitedScale/MapServer) | Federal land boundaries overlay |

All data is **U.S. Public Domain** — no API key required for BLM services.

## Features

- **Interactive map** powered by [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) with terrain, satellite, and outdoor styles
- **BLM overlay layers** — toggle official Mining Claims boundaries, PLSS grid, and Federal Lands directly on the map
- **Advanced search** by county, township, range, section, claim type, status, claimant name, and date range
- **Color-coded markers** — Closed (red), Abandoned (orange), Void (purple)
- **Automated data refresh** — GitHub Actions fetches fresh BLM data weekly
- **Dual data pipeline** — Node.js (primary) and Python (fallback) fetchers for reliability
- **PWA-ready** — installable as a Progressive Web App
- **Graceful fallback** — works without Mapbox token using OpenStreetMap tiles

## Quick Start

### Requirements

- Node.js 18+
- npm 9+

### 1. Install dependencies

```bash
# Root (installs concurrently for the dev script)
npm install

# Backend
cd backend && npm install

# Frontend
cd frontend && npm install --legacy-peer-deps
```

### 2. Configure Mapbox (optional but recommended)

Create a free Mapbox account at [console.mapbox.com](https://console.mapbox.com/) and get an access token.

```bash
# Create frontend/.env.local
echo "REACT_APP_MAPBOX_TOKEN=pk.your_token_here" > frontend/.env.local
```

> **Note:** The app works without a Mapbox token — it falls back to OpenStreetMap tiles. However, Mapbox provides superior terrain/satellite imagery and the Outdoors style optimized for land exploration.

### 3. Fetch fresh BLM data (optional)

```bash
cd scripts && node fetch_blm_data.js
```

This fetches the latest data from BLM's official services and saves it to `frontend/src/data/blm_claims.json`. The app ships with seed data, so this step is optional for development.

### 4. Start the development servers

```bash
# From the repo root — starts backend on :3000 and frontend on :3001
npm run dev
```

Or start individually:

```bash
npm run start:backend   # Express API  → http://localhost:3000
npm run start:frontend  # React app    → http://localhost:3001
```

Open **http://localhost:3001** in your browser, select a county (or click Show Advanced), then click **Search Claims**.

## Map Layers

The map includes three toggleable BLM overlay layers sourced directly from official government GIS services:

| Layer | Description | Zoom Level |
|-------|-------------|-----------|
| **Mining Claims** | Official BLM claim boundaries (active + closed) | 8+ |
| **PLSS Grid** | Township/Range/Section survey grid | 8+ |
| **Federal Lands** | BLM Surface Management Agency boundaries | 6+ |

These layers are served as raster tiles directly from `gis.blm.gov` — no intermediate processing or API key required.

## API Reference

The backend runs on port 3000 (configurable via `PORT`).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Server health check |
| GET | `/api/counties` | Sorted list of all 15 Arizona counties |
| GET | `/api/claims/search` | Search claims with optional filters |
| GET | `/api/claims/:id` | Get a single claim by numeric id |

### Search query parameters

All parameters are optional. Omitting a parameter returns all records for that dimension.

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `county` | string | `MARICOPA` | County name (case-insensitive match) |
| `township` | string | `T5N` | Township code (partial match) |
| `range` | string | `R3E` | Range code (partial match) |
| `section` | string | `14` | Section number (exact match) |
| `claim_type` | string | `LODE` | `LODE`, `PLACER`, `MILLSITE`, or `TUNNEL SITE` |
| `case_disposition` | string | `CLOSED` | `CLOSED`, `ABANDONED`, or `VOID` |
| `date_from` | date | `2010-01-01` | Claims closed on or after this date |
| `date_to` | date | `2020-12-31` | Claims closed on or before this date |
| `claimant` | string | `smith` | Case-insensitive substring match on claimant name |

## Data Pipeline

The app uses a **build-time data embedding** strategy for GitHub Pages deployment:

```
BLM ArcGIS REST API  →  scripts/fetch_blm_data.js  →  frontend/src/data/blm_claims.json  →  React build
```

### How it works

1. `scripts/fetch_blm_data.js` (or `scripts/blm_fetcher.py` as fallback) queries the BLM NLSDB and HUB services
2. Records are normalized, deduplicated, and saved as JSON
3. The React app imports this JSON at build time — no runtime API calls to BLM
4. GitHub Actions refreshes the data weekly (Monday 6 AM UTC) and on every deploy

### Data fields

Each claim record includes:

| Field | Source | Description |
|-------|--------|-------------|
| `blm_case_id` | CSE_NR | Official BLM case serial number |
| `claim_name` | CSE_NAME | Geographic name of the claim |
| `claim_type` | BLM_PROD | LODE, PLACER, MILLSITE, or TUNNEL SITE |
| `case_disposition` | CSE_DISP | CLOSED, ABANDONED, or VOID |
| `latitude/longitude` | Geometry centroid | Derived from PLSS polygon geometry |
| `acreage` | RCRD_ACRS | Recorded acres |
| `data_quality` | QLTY | BLM data quality score (0–100) |
| `patented` | MC_PATENTED | Whether claim was patented |

## Running Tests

```bash
# All tests (backend + frontend)
npm test

# Backend only (Jest + Supertest)
npm run test:backend

# Frontend only (React Testing Library)
npm run test:frontend
```

## Production Build

```bash
REACT_APP_MAPBOX_TOKEN=pk.your_token npm run build:frontend
```

For GitHub Pages deployment, add `MAPBOX_TOKEN` as a repository secret.

## Environment Variables

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_MAPBOX_TOKEN` | *(empty)* | Mapbox GL JS access token (falls back to OSM if empty) |
| `REACT_APP_API_URL` | `http://localhost:3000/api` | Backend API base URL (not used in Pages mode) |

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server listen port |
| `CORS_ORIGIN` | `http://localhost:3000,http://localhost:3001` | Comma-separated allowed origins |
| `DATABASE_URL` | *(none)* | Reserved — not used in current runtime |

## Deployment

| Layer | Recommended platform |
|-------|---------------------|
| Frontend (static) | GitHub Pages, Vercel, Netlify |
| Backend (API) | Render, Railway, Fly.io |

### GitHub Pages (current)

The app auto-deploys to GitHub Pages on every push to `main`. Add the `MAPBOX_TOKEN` secret in your repository settings for the best map experience.

### Secrets to configure

| Secret | Where | Description |
|--------|-------|-------------|
| `MAPBOX_TOKEN` | GitHub repo secrets | Your Mapbox public access token |

## CI/CD

GitHub Actions workflows:

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push/PR to main | Run tests + verify build |
| `deploy.yml` | Push to main | Build + deploy to GitHub Pages |
| `refresh-data.yml` | Weekly (Mon 6AM UTC) + manual | Refresh BLM data from live services |

## Technologies

| Layer | Stack |
|-------|-------|
| Map | Mapbox GL JS 3.4 (with OpenStreetMap fallback) |
| Frontend | React 18, React Router 6 |
| Backend | Node.js, Express 5, Helmet, CORS |
| Data | BLM NLSDB + HUB ArcGIS REST (open, public domain) |
| Overlays | BLM Mining Claims, PLSS CadNSDI, Surface Management Agency |
| Testing | Jest, Supertest, React Testing Library |
| CI/CD | GitHub Actions |
| Deployment | GitHub Pages (static PWA) |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Pages (Static)                      │
├─────────────────────────────────────────────────────────────┤
│  React App                                                   │
│  ├── MapView (Mapbox GL JS)                                 │
│  │   ├── Claim markers (color-coded by status)              │
│  │   ├── BLM Mining Claims overlay (raster tiles)           │
│  │   ├── PLSS Grid overlay (raster tiles)                   │
│  │   └── Federal Lands overlay (raster tiles)               │
│  ├── SearchPanel (county, PLSS, type, status, date)         │
│  └── ClaimsList (paginated results with detail panels)      │
├─────────────────────────────────────────────────────────────┤
│  Embedded Data (build-time)                                  │
│  └── blm_claims.json ← scripts/fetch_blm_data.js           │
│                          ├── BLM NLSDB Closed Claims        │
│                          └── BLM HUB MLRS Closed Claims     │
├─────────────────────────────────────────────────────────────┤
│  External Tile Services (runtime, no key needed)             │
│  ├── gis.blm.gov/nlsdb (Mining Claims MapServer)           │
│  ├── gis.blm.gov/arcgis (PLSS CadNSDI)                    │
│  └── gis.blm.gov/arcgis (SMA boundaries)                   │
└─────────────────────────────────────────────────────────────┘
```

## License

MIT

---

<sub>CREATED BY CHARLEY FOR ANGIE</sub>
