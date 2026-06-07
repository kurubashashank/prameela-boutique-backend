require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const sareeRoutes = require('./routes/sarees');
const edgeDesignRoutes = require('./routes/edgeDesigns');
const uploadRoutes = require('./routes/upload');
const enquiryRoutes = require('./routes/enquiries');
const emailRelayRoutes = require('./routes/emailRelay');

const app = express();
let mongoConnectionPromise = null;

const parseOrigins = (value) => (value || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [
  ...parseOrigins(process.env.FRONTEND_URL),
  ...parseOrigins(process.env.CORS_ORIGIN),
  'https://prameela-boutique.vercel.app',
  'https://frontend-lovat-rho-65.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean);

const connectMongo = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured');
  }

  if (!mongoConnectionPromise) {
    mongoConnectionPromise = mongoose.connect(process.env.MONGODB_URI)
      .then(() => console.log('MongoDB connected'))
      .catch((err) => {
        mongoConnectionPromise = null;
        console.error('MongoDB connection error:', err);
        throw err;
      });
  }

  await mongoConnectionPromise;
};

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// The relay is intentionally database-independent so it can run as a small
// HTTPS-to-SMTP bridge on a platform that permits outbound SMTP.
app.use('/api/email', emailRelayRoutes);

app.use(async (req, res, next) => {
  try {
    await connectMongo();
    next();
  } catch (error) {
    res.status(503).json({ error: 'Database is not available' });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sarees', sareeRoutes);
app.use('/api/edgeDesigns', edgeDesignRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/enquiries', enquiryRoutes);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  connectMongo().catch(() => {
    console.warn('Backend started without a database connection');
  });

  app.listen(PORT, () => {
    console.log(`Prameela Boutique Backend running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
}

module.exports = app;
