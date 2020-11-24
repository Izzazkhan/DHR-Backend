const mongoose = require("mongoose");
const ChiefComplaintSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
    },
    name: {
      type: String,
    },
    patient: {
      type: mongoose.Schema.ObjectId,
      ref: "patient",
    },
    productionArea: {
      type: mongoose.Schema.ObjectId,
      ref: "ProductionArea",
    },
  },
  {
    timestamps: true,
  },
);
module.exports = mongoose.model("ChiefComplaint", ChiefComplaintSchema);
