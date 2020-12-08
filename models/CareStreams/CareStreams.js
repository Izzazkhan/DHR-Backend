const mongoose = require('mongoose');

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
    treatmentOrders: [
      {
        name: String,
        subType: [
          {
            type: String,
          },
        ],
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
    mdNotification: [
      {
        name: String,
        subType: [
          {
            type: String,
          },
        ],
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
      ref: 'Staff',
    },
    updateRocord: [
      {
        updatedAt: {
          type: Date,
        },
        updatedBy: {
          type: mongoose.Schema.ObjectId,
          ref: 'Staff',
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
module.exports = mongoose.model('careStream', CareStreamSchema);
