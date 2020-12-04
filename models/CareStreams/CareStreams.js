const mongoose = require('mongoose');

const CareStreamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    inclusionCriteria: [{ type: String }],
    exclusionCriteria: [
      {
        name: {
          type: String,
        },
      },
    ],
    investigations: [
      {
        name: {
          type: String,
        },
      },
    ],
    precautions: [
      {
        name: {
          type: String,
        },
      },
    ],
    treatmentOrders: [
      {
        name: {
          type: String,
          subType: {
            type: String,
          },
        },
      },
    ],
    fluidsIV: [
      {
        name: {
          type: String,
        },
      },
    ],
    medications: [
      {
        name: {
          type: String,
        },
      },
    ],
    mdNotification: [
      {
        name: {
          type: String,
          subType: {
            type: String,
          },
        },
      },
    ],
    status: {
      type: String,
    },
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
