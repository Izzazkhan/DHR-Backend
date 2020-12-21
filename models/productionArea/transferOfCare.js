const mongoose = require('mongoose');

const TOCSchema = new mongoose.Schema({
  id: {
    type: Number,
  },
  roomNumber: {
    type: Number,
  },
  productionArea: {
    type: mongoose.Schema.ObjectId,
    ref: 'ProductionArea',
  },
  patient: {
    type: mongoose.Schema.ObjectId,
    ref: 'patient',
  },
  staff: {
    type: mongoose.Schema.ObjectId,
    ref: 'patient',
  },
  status: {
    type: String,
    enum: ['Pending', 'InProgress'],
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

module.exports = mongoose.model('TransferOfCare', TOCSchema);
