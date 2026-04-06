# Mining Claim Locator

An interactive web application for locating expired and abandoned mining claims in Arizona using BLM data.

## What this app does

The app currently runs in **sample-data mode**: the Express backend serves a curated set of real-looking BLM mining claim records held in memory and applies real filtering logic against them. No database is required to run the app. Five sample claims across five Arizona counties (MARICOPA, PIMA, YAVAPAI, COCHISE, MOHAVE) are included out of the box so you can immediately exercise search and map features.

A PostgreSQL/PostGIS schema (`scripts/setup_database.sql`) and a BLM data ingestion script (`scripts/blm_fetcher.py`) are included in the repository as **reserved future work**. They are not wired into the running API in this release. Connecting a live database is documented in the [Database Setup (Future)](#database-setup-future) section below.

## Features

- **Interactive map** powered by [Leaflet](https://leafletjs.com/) and OpenStreetMap — no API key required
- **Advanced search** by county, township, range, section, claim type, status, claimant name, and date range
- **Real filtering** — search parameters genuinely reduce or expand results
- **5 sample claims** from 5 different Arizona counties included out of the box

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

### 2. Start the development servers

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

### Example requests

```bash
# All claims
curl http://localhost:3000/api/claims/search

# Abandoned placer claims in Pima county
curl "http://localhost:3000/api/claims/search?county=PIMA&claim_type=PLACER&case_disposition=ABANDONED"

# Claims closed 2010–2020
curl "http://localhost:3000/api/claims/search?date_from=2010-01-01&date_to=2020-12-31"

# Single claim detail
curl http://localhost:3000/api/claims/1
```

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
npm run build:frontend
# Output: frontend/build/
```

Set `REACT_APP_API_URL` before building to point the frontend at your deployed API:

```bash
REACT_APP_API_URL=https://api.yourhost.com/api npm run build:frontend
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server listen port |
| `CORS_ORIGIN` | `http://localhost:3000,http://localhost:3001` | Comma-separated allowed origins |
| `DATABASE_URL` | *(none)* | Reserved — not used in current runtime |

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_API_URL` | `http://localhost:3000/api` | Backend API base URL |

## Database Setup (Future)

The running API uses in-memory sample data. When you are ready to connect a live PostgreSQL database:

1. Create the database and schema:

```bash
psql -U postgres -c 'CREATE DATABASE mining_claims;'
psql -U postgres -d mining_claims -f scripts/setup_database.sql
```

2. Set `DATABASE_URL` in `backend/.env`:

```
DATABASE_URL=******localhost:5432/mining_claims
```

3. Update `backend/routes/claims.js` to query the database via `pg.Pool` instead of the in-memory `SAMPLE_CLAIMS` array.

4. Optionally populate from BLM data (requires Python 3 + `scripts/requirements.txt`):

```bash
pip install -r scripts/requirements.txt
python scripts/blm_fetcher.py
```

## Deployment

| Layer | Recommended platform |
|-------|---------------------|
| Frontend (static) | GitHub Pages, Vercel, Netlify |
| Backend (API) | Render, Railway, Fly.io |

The frontend is a standard Create React App build and can be served from any static host. The backend is a plain Express app with no special runtime requirements. Set `REACT_APP_API_URL` to your backend's URL at build time and set `CORS_ORIGIN` to your frontend's origin on the backend.

## CI/CD

A GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push and pull request:

1. **Backend Tests** — Jest + Supertest
2. **Frontend Tests** — React Testing Library
3. **Frontend Build** — verifies the production build succeeds

## Technologies

| Layer | Stack |
|-------|-------|
| Backend | Node.js, Express 5, Helmet, CORS |
| Frontend | React 18, react-leaflet 4, Leaflet 1.9, OpenStreetMap |
| Data | In-memory sample BLM records with real filtering; PostGIS schema reserved for future live data |
| Testing | Jest, Supertest, React Testing Library |
| CI | GitHub Actions |

## Current Limitations

- The app ships with 5 sample claims. Live BLM data ingestion requires the optional database setup described above.
- No authentication or rate limiting is implemented (appropriate for local/demo use).
- `scripts/blm_fetcher.py` accesses BLM endpoints that require network access and may require registration for full API usage.

## License

MIT
