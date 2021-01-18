const mongoose = require('mongoose');

const houseKeepingSchema = new mongoose.Schema({
  assignedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'staff',
  },
  requestedBy: { type: String },
  requestedNo: String,
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
    ref: 'room',
  },
  assignedTime: Date,
  task: { type: String },
  status: { type: String, default: 'pending' },
  updatedAt: Date,
});

module.exports = mongoose.model('houseKeeperRequest', houseKeepingSchema);
