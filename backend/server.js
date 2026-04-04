const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Arizona counties list
app.get('/api/counties', (req, res) => {
  res.json([
    'APACHE', 'COCHISE', 'COCONINO', 'GILA', 'GRAHAM', 'GREENLEE',
    'LA PAZ', 'MARICOPA', 'MOHAVE', 'NAVAJO', 'PIMA', 'PINAL',
    'SANTA CRUZ', 'YAVAPAI', 'YUMA'
  ]);
});

// Claims routes
const claimsRouter = require('./routes/claims');
app.use('/api/claims', claimsRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
