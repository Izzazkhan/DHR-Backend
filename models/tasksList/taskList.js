const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  condition: {
    type: String,
  },
  status: {
    type: String,
  },
  patient: {
    type: mongoose.Schema.ObjectId,
    ref: 'patient',
  },
  productionArea: {
    type: mongoose.Schema.ObjectId,
    ref: 'Rooms',
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

module.exports = mongoose.model('task', taskSchema);
