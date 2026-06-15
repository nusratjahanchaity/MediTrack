const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  dosage: {
    type: String,
    required: true,
    trim: true
  },
  time: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'Tablet',
    enum: ['Tablet', 'Syrup', 'Injection']
  },
  color: {
    type: String,
    default: '#3B82F6'
  },
  taken: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Medicine', medicineSchema);
