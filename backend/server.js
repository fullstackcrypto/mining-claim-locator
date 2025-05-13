const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Sample claims
app.get('/api/claims/search', (req, res) => {
  res.json([
    {
      id: 1,
      blm_case_id: 'AZMC123456',
      claim_name: 'DESERT GOLD',
      claim_type: 'LODE',
      claimant_name: 'ARIZONA MINERALS LLC',
      case_disposition: 'CLOSED',
      location_date: '1995-06-12',
      close_date: '2010-09-01',
      county: 'MARICOPA',
      township: 'T5N',
      range: 'R3E',
      section: '14',
      latitude: 33.4484,
      longitude: -112.0740
    }
  ]);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
