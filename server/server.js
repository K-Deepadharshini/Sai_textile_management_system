import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import helmet from 'helmet';
import morgan from 'morgan';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import productionRoutes from './routes/productionRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import dispatchRoutes from './routes/dispatchRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import messageRoutes from './routes/messageRoutes.js';

// Import middleware
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { requestLogger } from './middleware/loggingMiddleware.js';
import { apiLimiter, authLimiter } from './middleware/rateLimitMiddleware.js';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) {
      return callback(null, true);
    }
    
    // Allow localhost with any port
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow Render domains (both frontend and backend)
    if (origin.includes('onrender.com')) {
      return callback(null, true);
    }
    
    // Allow configured origin(s) from environment
    const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(o => o.trim()).filter(o => o);
    if (allowedOrigins.length > 0 && allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    console.log('CORS blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Request parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(requestLogger);

// Rate limiting
app.use('/api/auth/', authLimiter);
app.use('/api/', apiLimiter);

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Sai Textile Management System API',
    version: '1.0.0',
    documentation: '/api/health',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      inventory: '/api/inventory',
      invoices: '/api/invoices',
      dispatch: '/api/dispatch',
      production: '/api/production',
      reports: '/api/reports',
      messages: '/api/messages'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/messages', messageRoutes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/textile-management')
.then(() => {
  console.log('✅ MongoDB connected successfully');
  
  // Create indexes
  mongoose.connection.db.collection('users').createIndex({ email: 1 }, { unique: true });
  mongoose.connection.db.collection('products').createIndex({ productCode: 1 }, { unique: true });
  mongoose.connection.db.collection('orders').createIndex({ orderNumber: 1 }, { unique: true });
  mongoose.connection.db.collection('invoices').createIndex({ invoiceNumber: 1 }, { unique: true });
  
  console.log('✅ Database indexes created');
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  // Close server & exit process
  // server.close(() => process.exit(1));
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  await mongoose.connection.close();
  process.exit(0);
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
  console.log(`📁 Upload directory: ${path.join(__dirname, 'uploads')}`);
});

export default server;