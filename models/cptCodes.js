const mongoose = require('mongoose');

const cptCodesSchema = new mongoose.Schema({
  Group: {
    type: String,
  },
  CPT_CODE: {
    type: String,
  },
  SHORT_DESCRIPTION: {
    type: String,
  },
  LONG_DESCRIPTION: {
    type: String,
  },
  FULL_DESCRIPTION: {
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
    default: Date.now,
  },
});

module.exports = mongoose.model('cptCodes', cptCodesSchema);
