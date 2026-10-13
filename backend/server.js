require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initSchema } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const complaintRoutes = require('./routes/complaints');
const categoryRoutes = require('./routes/categories');
const locationRoutes = require('./routes/locations');
const notificationRoutes = require('./routes/notifications');
const slaRoutes = require('./routes/sla');
const analyticsRoutes = require('./routes/analytics');
const reportRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or same-origin)
    // or from any localhost frontend port (5173, 5174, etc.)
    if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive in dev
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
const uploadDir = path.resolve(__dirname, process.env.UPLOAD_DIR || 'uploads');
app.use('/uploads', express.static(uploadDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/sla', slaRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'Campus Complaint Service System API',
    timestamp: new Date().toISOString()
  });
});

// Centralized error handler
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    await initSchema();
    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(` Campus Complaint Service System API Server Running `);
      console.log(` URL: http://localhost:${PORT}`);
      console.log(` Upload Directory: ${uploadDir}`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
