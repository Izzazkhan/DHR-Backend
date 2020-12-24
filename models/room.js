const mongoose = require('mongoose');

const RoomsSchema = new mongoose.Schema(
  {
    roomId: { type: String },
    roomNo: { type: Number },
    noOfBeds: { type: Number },
    beds: [
      {
        bedId: { type: String },
        availability: { type: Boolean },
        status: { type: String },
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
    availability: { type: Boolean },
    disabled: { type: Boolean },
    status: { type: String },
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
  {
    timestamps: true,
  }
);
module.exports = mongoose.model('room', RoomsSchema);
