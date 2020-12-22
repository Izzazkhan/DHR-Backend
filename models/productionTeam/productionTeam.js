const mongoose = require('mongoose');

const productionTeamSchema = new mongoose.Schema({
  id: {
    type: String,
  },
  name: {
    type: String,
  },
  group: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'staff',
    },
  ],
  productionArea: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'ProductionArea',
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});
module.exports = mongoose.model('productionTeam', productionTeamSchema);
