const mongoose = require('mongoose');

const codeBlueSchema = new mongoose.Schema({
  addedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'staff',
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
});

module.exports = mongoose.model('CodeBlue', codeBlueSchema);
