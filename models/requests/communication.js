const mongoose = require('mongoose');

const CommunicationRequestSchema = new mongoose.Schema({
  requestId: {
    type: String,
  },
  reason: {
    type: String,
  },
  others: {
    type: String,
  },
  generatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'staff',
  },
  generatedTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'staff',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model(
  'CommunicationRequest',
  CommunicationRequestSchema
);
