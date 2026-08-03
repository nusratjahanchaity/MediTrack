const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  performedBy: {
    type: String,
    required: true
  },
  performedByEmail: {
    type: String,
    required: true
  },
  performedByRole: {
    type: String,
    required: true,
    enum: ['user', 'caregiver', 'admin']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
