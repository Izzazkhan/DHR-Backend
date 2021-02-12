const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  shiftId: {
    type: String,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  name: {
    type: String,
  },
  startTime: {
    type: Date,
  },
  endTime: {
    type: Date,
  },
  addedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'staff',
  },
  createdAt: {
    type: Date,
  },
  disabledAt: {
    type: Date,
  },
  disabledBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'staff',
  },
});

module.exports = mongoose.model('Shift', shiftSchema);
