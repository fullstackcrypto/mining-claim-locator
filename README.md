# Mining Claim Locator

An application for locating expired and abandoned mining claims in Arizona using BLM data.

## Features
- Search BLM mining claims by location, status, and other parameters
- Interactive map visualization of claim locations
- Compatible with MLRS and LR2000 data formats
- Works with Google Maps and USGS elevation data

## Setup
1. Clone the repository
2. Install dependencies:
cd backend && npm install
cd ../frontend && npm install
3. Start the servers:
cd backend && node server.js
cd frontend && npm start
## Technologies
- Backend: Node.js, Express, PostgreSQL (optional)
- Frontend: React, Google Maps API
- Data: BLM MLRS/LR2000 mining claim records
