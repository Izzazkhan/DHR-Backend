const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const ChiefComplaintSchema = new mongoose.Schema(
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
    productionArea: [
      {
        productionAreaId: {
          type: mongoose.Schema.ObjectId,
          ref: 'productionArea',
        },
        assignedBy: {
          type: mongoose.Schema.ObjectId,
          ref: 'staff',
        },
        assignedTime: {
          type: Date,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);
ChiefComplaintSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('chiefComplaint', ChiefComplaintSchema);
