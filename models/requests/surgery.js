const mongoose = require("mongoose");
const SurgeryRequestSchema = new mongoose.Schema({
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
  surgeryRequest: [
    {
      SRrequestNo: {
        type: String,
      },
      serviceId: {
        type: mongoose.Schema.ObjectId,
        ref: "SurgeryService",
      },
      requesterName: {
        type: String,
      },
      serviceCode: {
        type: String,
      },
      serviceName: {
        type: String,
      },
      status: {
        type: String,
      },
      requester: {
        type: mongoose.Schema.ObjectId,
        ref: "staff",
      },
      results: {
        type: String,
      },
      sampleId: {
        type: String,
      },
      comments: {
        type: String,
      },
      serviceType: {
        type: String,
      },
      date: {
        type: Date,
        default: Date.now,
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
module.exports = mongoose.model("SurgeryRequest", SurgeryRequestSchema);
