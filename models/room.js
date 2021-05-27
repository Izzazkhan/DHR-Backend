const mongoose = require('mongoose');

const RoomsSchema = new mongoose.Schema(
  {
    roomId: { type: String },
    roomNo: { type: Number },
    noOfBeds: { type: Number },
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
    assingedToPA: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'staff',
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
  {
    timestamps: true,
  }
);
module.exports = mongoose.model('room', RoomsSchema);
