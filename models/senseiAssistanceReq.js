const mongoose = require('mongoose');

const senseiAssistanceReq = new mongoose.Schema({
  edrId: {
    type: mongoose.Schema.ObjectId,
    ref: 'EDR',
  },
  assignedTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'staff',
  },
  assignedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'staff',
  },
  reason: String,
  nurseNotes: String,

  status: {
    type: String,
    default: 'pending',
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },

  completionDate: {
    type: Date,
  },
});

module.exports = mongoose.model('senseiAssistanceReq', senseiAssistanceReq);
