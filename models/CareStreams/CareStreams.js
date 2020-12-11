const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const CareStreamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    identifier: [
      {
        value: { type: String },
      },
    ],
    inclusionCriteria: [{ type: String }],
    exclusionCriteria: [{ type: String }],
    investigations: [{ type: String }],
    precautions: [{ type: String }],
    // treatmentOrders: [
    //   {
    //     name: String,
    //     subType: [
    //       {
    //         type: String,
    //       },
    //     ],
    //   },
    // ],
    treatmentOrders: [
      {
        type: String,
      },
    ],
    fluidsIV: [
      {
        type: String,
      },
    ],
    medications: [
      {
        type: String,
      },
    ],
    // mdNotification: [
    //   {
    //     name: String,
    //     subType: [
    //       {
    //         type: String,
    //       },
    //     ],
    //   },
    // ],
    mdNotifcation: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'staff',
    },
    availability: { type: Boolean },
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
    // productionArea: {
    //   type: mongoose.Schema.ObjectId,
    //   ref: 'ProductionArea',
    // },
    // patient: {
    //   type: mongoose.Schema.ObjectId,
    //   ref: 'patient',
    // },
  },
  {
    timestamps: true,
  }
);
CareStreamSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('careStream', CareStreamSchema);
