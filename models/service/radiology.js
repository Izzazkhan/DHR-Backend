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
    type: Number,
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
  availability: { type: Boolean },
  disabled: { type: Boolean },
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
});

radiologyServiceSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('RadiologyService', radiologyServiceSchema);
