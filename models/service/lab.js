const mongoose = require('mongoose');

const LaboratoryServiceSchema = new mongoose.Schema({
  identifier: [
    {
      value: { type: String },
    },
  ],
  name: {
    type: String,
  },
  type: {
    type: String,
  },
  price: {
    type: String,
  },
  status: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updateRocord: [
    {
      updatedAt: {
        type: Date,
      },
      updatedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'Staff',
      },
      reason: {
        type: String,
      },
    },
  ],
  active: [
    {
      active: {
        type: Boolean,
        default: true,
      },
      reason: {
        type: String,
      },
      changedAt: {
        type: Date,
      },
      changedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'staff',
      },
    },
  ],
});
module.exports = mongoose.model('LaboratoryService', LaboratoryServiceSchema);
