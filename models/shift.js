const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  shiftId: {
    type: String,
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

module.exports = mongoose.model('Shift', shiftSchema);
