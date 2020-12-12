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
    patient: {
      type: mongoose.Schema.ObjectId,
      ref: 'patient',
    },
    productionArea: {
      type: mongoose.Schema.ObjectId,
      ref: 'ProductionArea',
    },
    addedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'staff',
    },
    status: {
      type: String,
    },
    availability: { type: Boolean },
    disabled: { type: Boolean },
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
ChiefComplaintSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('chiefComplaint', ChiefComplaintSchema);
