const mongoose = require('mongoose');

const cdtCodesSchema = new mongoose.Schema({
  Code: {
    type: String,
  },
  Nomenclature: {
    type: String,
  },
  Description: {
    type: String,
  },
  status: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
});

module.exports = mongoose.model('cdtcodes', cdtCodesSchema);
