const mongoose = require('mongoose');

const ProductionAreaSchema = new mongoose.Schema({
  productionAreaName: {
    type: String,
  },
  noOfPatients: {
    type: Number,
  },
  staff: {
    type: mongoose.Schema.ObjectId,
    ref: 'staff',
  },
  rooms: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Rooms',
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ProductionArea', ProductionAreaSchema);
