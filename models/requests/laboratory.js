const mongoose = require('mongoose');

const LaboratoryRequestSchema = new mongoose.Schema({
  requestNo: {
    type: String,
  },
  patientId: {
    type: mongoose.Schema.ObjectId,
    ref: 'patient',
  },

  reasonCode: [
    {
      type: String,
    },
  ],
  name: {
    type: String,
  },
  orderDetail: [
    {
      type: String,
    },
  ],
  price: {
    type: Number,
  },
  status: {
    type: String,
  },
  quantityQuantity: {
    type: Number,
  },
  authoredOn: {
    type: Date,
    default: Date.now,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
  labRequest: [
    {
      LRrequestNo: {
        type: String,
      },
      serviceId: {
        type: mongoose.Schema.ObjectId,
        ref: 'LaboratoryService',
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
      },
      results: {
        type: String,
      },
      sampleId: {
        type: String,
      },
      note: [
        {
          authorReference: {
            type: mongoose.Schema.ObjectId,
            // Ref to (Practitioner|Patient|RelatedPerson|Organization)
          },
        },
        {
          authorString: {
            type: String,
          },
        },
        {
          time: {
            type: Date,
          },
        },
        {
          text: {
            type: String,
            // Markdown
          },
        },
      ],
      serviceType: {
        type: String,
      },
      date: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});
module.exports = mongoose.model('LaboratoryRequest', LaboratoryRequestSchema);
