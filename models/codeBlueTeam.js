const mongoose = require('mongoose');

const codeBlueSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'staff',
  },
  status: {
    type: String,
    default: 'Un_Assigned',
  },
  teamName: {
    type: String,
  },
  doctors: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'staff',
    },
  ],
  nurses: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'staff',
    },
  ],
  anesthesiologists: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'staff',
    },
  ],
  createdAt: Date,
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

module.exports = mongoose.model('CodeBlue', codeBlueSchema);
