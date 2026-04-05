const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const claimsRouter = require('./routes/claims');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

app.get('/api/counties', (req, res) => {
  res.json([
    'APACHE', 'COCHISE', 'COCONINO', 'GILA', 'GRAHAM',
    'GREENLEE', 'LA PAZ', 'MARICOPA', 'MOHAVE', 'NAVAJO',
    'PIMA', 'PINAL', 'SANTA CRUZ', 'YAVAPAI', 'YUMA'
  ]);
});

app.use('/api/claims', claimsRouter);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
