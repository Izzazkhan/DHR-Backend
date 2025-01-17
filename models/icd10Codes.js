const mongoose = require('mongoose');

const icd10CodesSchema = new mongoose.Schema({
  Code: {
    type: String,
  },
  ShortDesc: {
    type: String,
  },
  LongDesc: {
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

module.exports = mongoose.model('icd10Codes', icd10CodesSchema);
