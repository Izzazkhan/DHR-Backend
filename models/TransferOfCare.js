const mongoose = require('mongoose');

const TOCSchema = new mongoose.Schema({
  edrId: {
    type: mongoose.Schema.ObjectId,
    ref: 'EDR',
  },
  transferredBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'staff',
  },
  transferredTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'staff',
  },
  transferredAt: {
    type: Date,
  },
});

module.exports = mongoose.model('TOC', TOCSchema);
