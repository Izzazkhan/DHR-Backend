const mongoose = require('mongoose');

const FlagSchema = new mongoose.Schema(
  {
    edrId: {
      type: mongoose.Schema.ObjectId,
      ref: 'EDR',
    },
    patientId: {
      type: mongoose.Schema.ObjectId,
      ref: 'patientfhir',
    },
    // Other Staff
    generatedFrom: {
      // type: mongoose.Schema.ObjectId,
      // ref: 'staff',
      type: String,
    },
    // Sensei
    generatedFor: {
      // type: mongoose.Schema.ObjectId,
      // ref: 'staff',
      type: String,
    },
    card: String,
    reason: {
      type: String,
    },
    createdAt: {
      type: Date,
    },
    inProgressTime: {
      type: Date,
    },
    inProgressBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'staff',
    },
    completedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'staff',
    },
    completedTime: {
      type: Date,
    },
    status: {
      type: String,
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model('Flag', FlagSchema);
