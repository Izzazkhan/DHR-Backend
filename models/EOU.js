const mongoose = require('mongoose');

const EOUSchema = new mongoose.Schema({
  name: String,
  beds: [
    {
      bedId: {
        type: mongoose.Schema.ObjectId,
        ref: 'EouBed',
      },
    },
  ],
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'staff',
  },
  createdAt: {
    type: Date,
    default: Date.now(),
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

module.exports = mongoose.model('EOU', EOUSchema);
