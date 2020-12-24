const mongoose = require('mongoose');

const PASchema = new mongoose.Schema(
  {
    paId: { type: String },
    paName: { type: String },
    rooms: [
      {
        roomId: {
          type: mongoose.Schema.ObjectId,
          ref: 'room',
        },
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
module.exports = mongoose.model('productionArea', PASchema);
