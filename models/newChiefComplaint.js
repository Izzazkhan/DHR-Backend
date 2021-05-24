const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const newChiefComplaintSchema = new mongoose.Schema(
  {
    chiefComplaintId: {
      type: String,
    },
    name: {
      type: String,
    },
    addedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'staff',
    },
    status: {
      type: String,
    },
    availability: { type: Boolean, default: true },
    disabled: { type: Boolean, default: false },
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
newChiefComplaintSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('NewChiefComplaint', newChiefComplaintSchema);
