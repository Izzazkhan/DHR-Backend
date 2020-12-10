const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const radiologyServiceSchema = new mongoose.Schema({
  identifier: [
    {
      value: { type: String },
    },
  ],
  name: {
    type: String,
  },
  type: {
    type: String,
  },
  price: {
    type: String,
  },
  status: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  addedBy: {
    type: mongoose.Schema.ObjectId,
  },
  updateRecord: [
    {
      updatedAt: {
        type: Date,
      },
      updatedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'Staff',
      },
      reason: {
        type: String,
      },
    },
  ],
  active: [
    {
      active: {
        type: Boolean,
        default: true,
      },
      reason: {
        type: String,
      },
      changedAt: {
        type: Date,
      },
      changedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'staff',
      },
    },
  ],
});

radiologyServiceSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('RadiologyService', radiologyServiceSchema);
