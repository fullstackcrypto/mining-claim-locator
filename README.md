# Mining Claim Locator

An interactive web application for locating expired and abandoned mining claims in Arizona using BLM data.

## Features

- **Interactive map** powered by [Leaflet](https://leafletjs.com/) and OpenStreetMap – no API key required
- **Advanced search** by county, township, range, section, claim type, status, date range, and claimant name
- **5 sample claims** from 5 different Arizona counties (MARICOPA, PIMA, YAVAPAI, COCHISE, MOHAVE) included out of the box
- Compatible with BLM MLRS and LR2000 data formats
- Optional PostgreSQL/PostGIS backend for large datasets

## Quick Start

### Requirements

- Node.js 18+
- npm 9+

### 1. Install dependencies

```bash
# Root (adds `concurrently` for the dev script)
npm install

# Backend
cd backend && npm install

# Frontend
cd frontend && npm install --legacy-peer-deps
```

### 2. Start the development servers

```bash
# From the repo root – starts backend on :3000 and frontend on :3001
npm run dev
```

Or start individually:

```bash
npm run start:backend   # Express API  → http://localhost:3000
npm run start:frontend  # React app    → http://localhost:3001
```

Open **http://localhost:3001** in your browser, enter search criteria, and click **Search Claims**.

## API Reference

The backend exposes a REST API on port 3000 (configurable via `PORT` env var).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Server health check |
| GET | `/api/counties` | List of all 15 Arizona counties |
| GET | `/api/claims/search` | Search claims (see query params below) |
| GET | `/api/claims/:id` | Get a single claim by id |

### Search query parameters

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `county` | string | `MARICOPA` | Filter by county (uppercase) |
| `township` | string | `T5N` | Township code |
| `range` | string | `R3E` | Range code |
| `section` | string | `14` | Section number |
| `claim_type` | string | `LODE` | LODE, PLACER, MILLSITE, or TUNNEL SITE |
| `case_disposition` | string | `CLOSED` | CLOSED, ABANDONED, or VOID |
| `date_from` | date | `2010-01-01` | Claims closed on or after this date |
| `date_to` | date | `2020-12-31` | Claims closed on or before this date |
| `claimant` | string | `smith` | Case-insensitive claimant name search |

### Example requests

```bash
# All claims
curl http://localhost:3000/api/claims/search

# Abandoned placer claims in Pima county
curl "http://localhost:3000/api/claims/search?county=PIMA&claim_type=PLACER&case_disposition=ABANDONED"

# Claims closed between 2010 and 2020
curl "http://localhost:3000/api/claims/search?date_from=2010-01-01&date_to=2020-12-31"
```

## Running Tests

```bash
# All tests (backend + frontend)
npm test

# Backend only
npm run test:backend

# Frontend only
npm run test:frontend
```

## Production Build

```bash
npm run build:frontend
# Static files are output to frontend/build/
```

Set `REACT_APP_API_URL` before building to point the frontend at your production API:

```bash
REACT_APP_API_URL=https://api.example.com/api npm run build:frontend
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server listen port |
| `DATABASE_URL` | *(none)* | PostgreSQL connection string (optional) |
| `CORS_ORIGIN` | `http://localhost:3000,http://localhost:3001` | Comma-separated allowed origins |

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_API_URL` | `http://localhost:3000/api` | Backend API base URL |

## Database Setup (Optional)

The app works out-of-the-box with in-memory sample data. To connect a PostgreSQL database:

1. Create the database and schema:

```bash
npm run setup:db
```

2. Set `DATABASE_URL` in `backend/.env`:

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/mining_claims
```

3. Populate with BLM data:

```bash
# Requires Python 3 + dependencies from scripts/requirements.txt
pip install -r scripts/requirements.txt
npm run fetch:data
```

## CI/CD

A GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push and pull request:

- **Backend Tests** – Jest unit tests for all API endpoints
- **Frontend Tests** – React Testing Library component tests
- **Frontend Build** – Verifies the production build succeeds

## Technologies

| Layer | Stack |
|-------|-------|
| Backend | Node.js, Express 5, Helmet, CORS |
| Frontend | React 18, react-leaflet 4, Leaflet 1.9, OpenStreetMap |
| Data | BLM MLRS / LR2000 mining claim records |
| Database | PostgreSQL + PostGIS (optional) |
| Testing | Jest, Supertest, React Testing Library |
| CI/CD | GitHub Actions |

## License

MIT
