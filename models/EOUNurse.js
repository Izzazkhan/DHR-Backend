const mongoose = require('mongoose');

const eouNurseSchema = new mongoose.Schema({
  nurse: [
    {
      nurseId: {
        type: mongoose.Schema.ObjectId,
        ref: 'staff',
      },
      assignedAt: Date,
      assignedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'staff',
      },
    },
  ],
  bedNo: String,
  bedId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Bed',
  },
  edrId: {
    type: mongoose.Schema.ObjectId,
    ref: 'EDR',
  },
});

module.exports = mongoose.model('EOUNurse', eouNurseSchema);
