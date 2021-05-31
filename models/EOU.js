const mongoose = require('mongoose');

const EOUSchema = new mongoose.Schema({
  name: String,
  beds: [
    {
      bedIdDB: {
        type: mongoose.Schema.ObjectId,
        ref: 'Bed',
      },
      bedId: { type: String },
      bedNo: Number,
      availability: { type: Boolean },
      status: { type: String },
      assignedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'staff',
      },
      assignedAt: {
        type: Date,
        default: Date.now(),
      },
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
    },
  ],
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'staff',
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
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

module.exports = mongoose.model('EOU', EOUSchema);
