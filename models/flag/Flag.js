const mongoose = require('mongoose');

const FlagMgntSchema = new mongoose.Schema(
  {
    edrId: {
      type: mongoose.Schema.ObjectId,
      ref: 'EDR',
    },
    // Other Staff
    generatedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'staff',
    },
    // Sensei
    generatedTo: {
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
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model('FlagMgnt', FlagMgntSchema);
