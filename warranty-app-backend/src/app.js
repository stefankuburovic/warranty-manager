const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const storeRoutes = require('./routes/stores');
const categoryRoutes = require('./routes/categories');
const documentRoutes = require('./routes/documents');
const notificationRoutes = require('./routes/notifications');
const ocrRoutes = require('./routes/ocr');
const exportRoutes = require('./routes/export');
const familyRoutes = require('./routes/family');
const analyticsRoutes = require('./routes/analytics');
const barcodeRoutes = require('./routes/barcode');
const searchRoutes = require('./routes/search');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(helmet());
// CORS configuration - allow all origins in development, restricted in production
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:19000'])
    : true, // Allow all origins in development (React Native doesn't use CORS like browsers)
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/stores', storeRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/ocr', ocrRoutes);
app.use('/api/v1/export', exportRoutes);
app.use('/api/v1/family', familyRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/barcode', barcodeRoutes);
app.use('/api/v1/search', searchRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

module.exports = app;

