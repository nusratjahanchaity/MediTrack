const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  extracted: {
    type: Boolean,
    default: false
  },
  extractedData: [{
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    time: { type: String, required: true },
    type: { type: String, default: 'Tablet' },
    comment: { type: String, default: '' }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Prescription', prescriptionSchema);
