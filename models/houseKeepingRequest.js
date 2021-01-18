const mongoose = require('mongoose');

const houseKeepingSchema = new mongoose.Schema({
  assignedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'staff',
  },
  houseKeeperId: {
    type: mongoose.Schema.ObjectId,
    ref: 'staff',
  },
  productionAreaId: {
    type: mongoose.Schema.ObjectId,
    ref: 'productionArea',
  },
  roomId: {
    type: mongoose.Schema.ObjectId,
    ref: 'productionArea',
  },
  assignedTime: Date,
  task: { type: String },
  status: { type: String, default: 'pending' },
  updateRecord: [
    {
      updatedAt: {
        type: Date,
      },
      updatedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'staff',
      },
      reason: {
        type: String,
      },
    },
  ],
});

module.exports = mongoose.model('houseKeeperRequest', houseKeepingSchema);
