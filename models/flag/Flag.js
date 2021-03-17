const mongoose = require('mongoose');

const FlagSchema = new mongoose.Schema(
  {
    edrId: {
      type: mongoose.Schema.ObjectId,
      ref: 'EDR',
    },
    // Other Staff
    generatedFrom: {
      type: mongoose.Schema.ObjectId,
      ref: 'staff',
    },
    // Sensei
    generatedFor: {
      type: mongoose.Schema.ObjectId,
      ref: 'staff',
    },
    reason: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
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
