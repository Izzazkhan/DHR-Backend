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
    inclusionCriteria: [{ name: String, selected: Boolean }],
    exclusionCriteria: [{ name: String, selected: Boolean }],
    investigations: [{ name: String, selected: Boolean }],
    precautions: [{ name: String, selected: Boolean }],
    treatmentOrders: [
      {
        name: String,
        selected: Boolean,
        subType: [
          {
            name: String,
            selected: Boolean,
          },
        ],
      },
    ],
    fluidsIV: [
      {
        name: String,
        selected: Boolean,
      },
    ],
    medications: [
      {
        name: String,
        selected: Boolean,
      },
    ],
    mdNotification: [
      {
        name: String,
        selected: Boolean,
        subType: [
          {
            name: String,
            selected: Boolean,
          },
        ],
      },
    ],
    reassessments: [
      {
        name: String,
        selected: Boolean,
        subType: [
          {
            name: String,
            selected: Boolean,
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
      ref: 'staff',
    },
    availability: { type: Boolean },
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
CareStreamSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('careStream', CareStreamSchema);
