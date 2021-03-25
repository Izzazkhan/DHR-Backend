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
      type: String,
    },
    // Sensei
    generatedFor: {
      type: String,
    },
    card: String,
    reason: {
      type: String,
    },
    createdAt: {
      type: Date,
    },
    completedTime: {
      type: Date,
    },
    completedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'staff',
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
