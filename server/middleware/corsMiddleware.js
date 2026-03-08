// CORS Middleware Configuration
const cors = require('cors');

const corsOptions = {
  origin: ['https://api.geonix.live','http://localhost:3000', 'http://localhost:5173', 'http://my-react-frontend-ashitosh.s3-website.ap-south-1.amazonaws.com','https://www.geonix.live'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
};

module.exports = cors(corsOptions);
