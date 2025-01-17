const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const LaboratoryServiceSchema = new mongoose.Schema({
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
});

LaboratoryServiceSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('LaboratoryService', LaboratoryServiceSchema);
