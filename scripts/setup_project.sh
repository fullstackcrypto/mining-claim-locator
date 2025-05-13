#!/bin/bash
# setup_project.sh
# This script sets up the full Mining Claim Locator project

# Print commands as they execute
set -e
echo "Setting up Mining Claim Locator project..."

# Clone repository if needed
if [ ! -d "mining-claim-locator" ]; then
  echo "Cloning repository..."
  git clone https://github.com/fullstackcrypto/mining-claim-locator.git
  cd mining-claim-locator
else
  cd mining-claim-locator
  echo "Repository already exists, pulling latest..."
  git pull
fi

# Create project structure
echo "Creating project structure..."
mkdir -p backend frontend/src/{components,services,styles} data scripts tests

# Set up backend
echo "Setting up backend..."
cd backend
npm init -y
npm install express pg pg-postgis cors dotenv helmet axios
npm install -D nodemon typescript @types/express @types/node

# Create .env file for backend
cat > .env << EOL
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mining_claims
EOL

# Create PostgreSQL setup script
cd ../scripts

# Create Python virtual environment
echo "Setting up Python environment..."
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install geopandas requests beautifulsoup4 pandas numpy matplotlib sqlalchemy psycopg2-binary

# Create .env file for scripts
cat > .env << EOL
BLM_API_KEY=replace_with_actual_key_if_available
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mining_claims
EOL

# Set up frontend
cd ../frontend
npm init -y
npm install react react-dom react-router-dom axios leaflet google-earth-engine

# Create .env file for frontend
cat > .env << EOL
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_GOOGLE_API_KEY=replace_with_actual_key
EOL

# Create a package.json with scripts at the root level
cd ..
cat > package.json << EOL
{
  "name": "mining-claim-locator",
  "version": "1.0.0",
  "description": "Application to locate expired mining claims in Arizona",
  "main": "index.js",
  "scripts": {
    "start:backend": "cd backend && nodemon server.js",
    "start:frontend": "cd frontend && npm start",
    "setup:db": "psql -U postgres -c 'CREATE DATABASE mining_claims;' && psql -U postgres -d mining_claims -f scripts/setup_database.sql",
    "fetch:data": "cd scripts && source venv/bin/activate && python blm_fetcher.py",
    "dev": "concurrently 'npm run start:backend' 'npm run start:frontend'",
    "test": "echo 'No tests yet'"
  },
  "keywords": ["mining", "claims", "blm", "arizona", "geospatial"],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "concurrently": "^8.2.0"
  }
}
EOL

# Create README
cat > README.md << EOL
# Mining Claim Locator

An application to locate expired and abandoned mining claims in Arizona using BLM data.

## Features

- Search for expired mining claims by county, township/range/section, and timeframe
- Interactive map using Google Earth API and geospatial tools
- Data from Bureau of Land Management (BLM) sources
- Historical claim records from archives
- WCAG 2.0 compliant accessibility

## Setup

1. Clone the repository:
   \`\`\`
   git clone https://github.com/fullstackcrypto/mining-claim-locator.git
   cd mining-claim-locator
   \`\`\`

2. Run the setup script:
   \`\`\`
   chmod +x scripts/setup_project.sh
   ./scripts/setup_project.sh
   \`\`\`

3. Set up the database:
   \`\`\`
   npm run setup:db
   \`\`\`

4. Fetch initial data:
   \`\`\`
   npm run fetch:data
   \`\`\`

5. Start development servers:
   \`\`\`
   npm run dev
   \`\`\`

## Requirements

- Node.js 18+
- Python 3.8+
- PostgreSQL 14+ with PostGIS extension
- Google Earth API key (set in frontend/.env)

## License

MIT
EOL

# Create a simple .gitignore
cat > .gitignore << EOL
# Node
node_modules/
npm-debug.log

# Python
__pycache__/
*.py[cod]
*$py.class
venv/
env/
.env

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/

# Build artifacts
build/
dist/

# Data
data/*.csv
data/*.json
data/*.geojson

# Logs
*.log
logs/
EOL

echo "Project setup complete!"
echo "Next steps:"
echo "1. Set up PostgreSQL and create the mining_claims database"
echo "2. Run: npm run setup:db"
echo "3. Run: npm run fetch:data"
echo "4. Start the application: npm run dev"
