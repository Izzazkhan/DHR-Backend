const mongoose = require("mongoose");
const FlagMgntSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.ObjectId,
      ref: "patient",
    },
    staff: {
      type: mongoose.Schema.ObjectId,
      ref: "staff",
    },
    reason: {
      type: String,
    },
    date: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Progress", "InProgress", "Completed"],
    },
  },
  {
    timestamps: true,
  },
);
module.exports = mongoose.model("FlagMgnt", FlagMgntSchema);
