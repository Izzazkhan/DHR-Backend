const mongoose = require('mongoose');

const FlagSchema = new mongoose.Schema(
  {
    edrId: {
      type: mongoose.Schema.ObjectId,
      ref: 'EDR',
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
    updatedAt: {
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
