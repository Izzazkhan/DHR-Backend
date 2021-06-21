const mongoose = require('mongoose');

const eouNurseSchema = new mongoose.Schema({
  nurseId: {
    type: mongoose.Schema.ObjectId,
    ref: 'staff',
  },
  bedNo: String,
  bedId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Bed',
  },
  edrId: {
    type: mongoose.Schema.ObjectId,
    ref: 'EDR',
  },
  assignedAt: Date,
  assignedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'staff',
  },
});

module.exports = mongoose.model('EOUNurse', eouNurseSchema);
