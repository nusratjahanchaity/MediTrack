require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

// Initialize database connection
connectDB();

const app = express();

const path = require('path');

// Middleware
app.use(cors());
app.use(express.json());

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import Routes
const authRoutes = require('./routes/auth');
const medicineRoutes = require('./routes/medicine');
const prescriptionRoutes = require('./routes/prescription');
const userRoutes = require('./routes/users');
const historyRoutes = require('./routes/history');
const notificationRoutes = require('./routes/notifications');
const alertRoutes = require('./routes/alerts');

// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/alerts', alertRoutes);

// Start background medicine schedule checking worker
require('./utils/scheduler');

// Health check and database connection verification endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  // readyState values: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const states = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };

  res.json({
    status: 'UP',
    database: {
      status: states[dbStatus] || 'Unknown',
      code: dbStatus
    },
    timestamp: new Date()
  });
});

// Root welcome route
app.get('/', (req, res) => {
  res.send('MediTrack API Server is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
