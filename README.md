# Mining Claim Locator

An application for locating expired and abandoned mining claims in Arizona using BLM data.

## Features
- Search BLM mining claims by location, status, and other parameters
- Interactive map visualization of claim locations using Google Maps
- Compatible with MLRS and LR2000 data formats
- Works with Google Maps and USGS elevation data
- Falls back to a built-in sample dataset when the API or map is unavailable

## Deploying from GitHub (recommended)

### 1. Enable GitHub Pages
In your repository go to **Settings → Pages → Source** and select
**GitHub Actions**. The `deploy.yml` workflow will build the React frontend and
publish it automatically on every push to `main`.

### 2. Set GitHub Secrets / Variables
| Name | Where | Purpose |
|------|-------|---------|
| `GOOGLE_MAPS_API_KEY` | Repository **Secret** | Enables the interactive map |
| `API_URL` | Repository **Variable** | Points the frontend at your deployed backend (e.g. `https://my-api.onrender.com/api`). Leave blank to use the built-in sample data. |

Create an API key at <https://console.cloud.google.com/apis/credentials> and
restrict it to your GitHub Pages domain (`<user>.github.io`) for security.

### 3. (Optional) Deploy the backend to Render
1. Sign up at <https://render.com> and connect your GitHub repository.
2. Render will detect `render.yaml` and create a **Web Service** for the backend automatically.
3. In the Render dashboard set the `ALLOWED_ORIGINS` environment variable to your
   GitHub Pages URL (e.g. `https://<user>.github.io`) and, if you have a
   PostgreSQL database, set `DATABASE_URL`.
4. Copy the service URL and paste it into the `API_URL` GitHub Variable in step 2.

## Local development

```bash
# Backend (runs on http://localhost:3000)
cd backend && npm install && node server.js

# Frontend (runs on http://localhost:3001)
cd frontend && npm install && npm start
```

Copy `frontend/.env.example` to `frontend/.env` and fill in your values before
starting the frontend.

## Technologies
- **Backend**: Node.js, Express, PostgreSQL (optional – not required for sample data)
- **Frontend**: React, Google Maps JavaScript API
- **Data**: BLM MLRS/LR2000 mining claim records
- **CI/CD**: GitHub Actions → GitHub Pages (frontend), Render (backend)

