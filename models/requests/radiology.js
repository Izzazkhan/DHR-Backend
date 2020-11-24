const mongoose = require("mongoose");
const RadiologyRequestSchema = new mongoose.Schema({
  requestNo: {
    type: String,
  },
  patientId: {
    type: mongoose.Schema.ObjectId,
    ref: "patient",
  },
  requester: {
    type: mongoose.Schema.ObjectId,
  },
  reasonCode: [
    {
      type: String,
    },
  ],
  orderDetail: [
    {
      type: String,
    },
  ],
  status: {
    type: String,
  },
  radiologyRequest: [
    {
      RRrequestNo: {
        type: String,
      },
      quantityQuantity: {
        type: Number,
      },
      authoredOn: {
        type: Date,
        default: Date.now,
      },
      serviceId: {
        type: mongoose.Schema.ObjectId,
        ref: "RadiologyService",
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
      note: {
        authorReference: {
          type: mongoose.Schema.ObjectId,
        },
        authorString: {
          type: String,
        },
        time: {
          type: Date,
        },
        text: {
          type: String,
        },
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
module.exports = mongoose.model("RadiologyRequest", RadiologyRequestSchema);
