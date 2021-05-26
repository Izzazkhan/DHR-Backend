const mongoose = require('mongoose');

const EouBedSchema = new mongoose.Schema({
  bedId: { type: String },
  bedNo: Number,
  availability: { type: Boolean },
  status: { type: String },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'staff',
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  disabled: Boolean,
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

module.exports = mongoose.model('EouBed', EouBedSchema);
