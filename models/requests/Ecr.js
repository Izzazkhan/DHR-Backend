const mongoose = require("mongoose");
const ECRSchema = new mongoose.Schema({
  requestNo: {
    type: String,
  },
  patientId: {
    type: mongoose.Schema.ObjectId,
    ref: "patient",
  },
  generatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: "staff",
  },
  consultationNote: [
    {
      consultationNo: {
        type: String,
      },
      consultant: {
        type: mongoose.Schema.ObjectId,
        ref: "staff",
      },
      date: {
        type: Date,
        default: Date.now,
      },
      condition: {
        type: String,
      },
      consultationNotes: {
        type: String,
      },
      doctorNotes: {
        type: String,
      },
      audioNotes: {
        type: String,
      },
      status: {
        type: String,
        enum: ["Pending", "Completed"],
      },
      speciality: {
        type: String,
      },
      specialist: {
        type: String,
      },
      requester: {
        type: mongoose.Schema.ObjectId,
        ref: "staff",
      },
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
module.exports = mongoose.model("ECR", ECRSchema);
