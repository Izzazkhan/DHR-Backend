const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const edrSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.ObjectId,
    ref: 'patientfhir',
  },
  careStream: {
    type: mongoose.Schema.ObjectId,
    ref: 'careStream',
  },
  dcdForm: [
    {
      // dcdFormId: {
      //   type: String,
      // },
      versionNo: {
        type: String,
      },
      triageAssessment: [
        {
          status: { type: String, default: 'pending' },
          reason: { type: String },
          triageRequestNo: {
            type: String,
          },
          wieght: {
            type: String,
          },
          bloodSugarLevel: {
            type: String,
          },
          heartRate: {
            type: String,
          },
          bloodPressureSys: {
            type: String,
          },
          bloodPressureDia: {
            type: String,
          },
          respiratoryRate: {
            type: String,
          },
          temperature: {
            type: String,
          },
          FSBS: {
            type: String,
          },
          painScale: {
            type: String,
          },
          pulseOX: {
            type: String,
          },
          triageLevel: [
            {
              type: String,
            },
          ],
          generalAppearance: [
            {
              type: String,
            },
          ],
          headNeck: [
            {
              type: String,
            },
          ],
          respiratory: [
            {
              type: String,
            },
          ],
          cardiac: [
            {
              type: String,
            },
          ],
          abdomen: [
            {
              type: String,
            },
          ],
          neurological: [
            {
              type: String,
            },
          ],
          requester: {
            type: mongoose.Schema.ObjectId,
            ref: 'staff',
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
      emergencyCourse: [
        {
          name: String,
          text: String,
          details: {
            detailText: String,
          },
        },
      ],
      actionPlan: [
        {
          name: String,
          text: String,
        },
      ],
      investigation: [
        {
          name: String,
          detail: [
            {
              image: [{ type: String }],
              text: [{ type: String }],
              subTypes: [
                {
                  type: String,
                },
              ],
            },
          ],
        },
      ],
      pastHistory: [
        {
          name: String,
          detail: {
            text: String,
            subTypes: [
              {
                type: String,
              },
            ],
          },
        },
      ],

      medicationHistory: {
        name: String,
        description: String,
        image: String,
      },
      allergies: {
        name: String,
        description: String,
      },
      socialHX: [
        {
          name: String,
          detail: {
            text: String,
            subTypes: [
              {
                type: String,
              },
            ],
          },
        },
      ],
      familyHX: {
        type: String,
      },
      ros: [
        {
          name: String,
          subTypes: [
            {
              type: String,
            },
          ],
        },
      ],
      patientDetails: {
        timeSeen: {
          type: Date,
          // Date wil come from front End
        },
        room: {
          type: Number,
        },
        historian: {
          type: mongoose.Schema.ObjectId,
        },
      },

      historian: {
        type: String,
      },
      chiefComplaint: {
        type: String,
      },
      timing: {
        condition: {
          type: String,
        },
        time: {
          type: Date,
        },
      },
      severity: {
        type: Number,
        min: 0,
        max: 10,
      },
      modifyingFactors: {
        type: String,
      },
      similarSymptomsPrev: {
        type: String,
      },
      recentlyTreated: {
        type: String,
      },
      physicalExam: [
        {
          name: String,
          detail: [
            {
              text: String,
              image: String,
              subTypes: [
                {
                  type: String,
                },
              ],
            },
          ],
        },
      ],
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
    },
  ],
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
  chiefComplaint: [
    {
      chiefComplaintId: {
        type: mongoose.Schema.ObjectId,
        ref: 'chiefComplaint',
      },
      assignedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'staff',
      },
      assignedTime: {
        type: Date,
      },
      reason: String,
      comments: {
        type: String,
      },
      voiceNotes: {
        type: String,
      },
    },
  ],
  customerCare: [
    {
      customerCareId: {
        type: mongoose.Schema.ObjectId,
        ref: 'staff',
      },
      assignedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'staff',
      },
      assignedTime: {
        type: Date,
      },
      reason: String,
    },
  ],
  dcdFormStatus: {
    type: String,
    default: 'pending',
  },
  requestNo: {
    type: String,
  },
  generatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'staff',
  },
  consultationNote: [
    {
      consultationNo: {
        type: String,
      },
      date: {
        type: Date,
        default: Date.now,
      },
      description: {
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
      },
      specialty: {
        type: String,
      },
      specialist: {
        type: String,
      },
      requester: {
        type: mongoose.Schema.ObjectId,
        ref: 'staff',
      },
    },
  ],
  residentNotes: [
    {
      residentNoteNo: {
        type: String,
      },
      date: {
        type: Date,
        default: Date.now,
      },
      description: {
        type: String,
      },
      doctor: {
        type: mongoose.Schema.ObjectId,
        ref: 'staff',
      },
      note: {
        type: String,
      },
      section: {
        type: String,
      },
      audioNotes: {
        type: String,
      },
      code: [
        {
          type: String,
        },
      ],
    },
  ],
  pharmacyRequest: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'pharmacyRequest',
    },
  ],
  labRequest: [
    {
      serviceId: {
        type: mongoose.Schema.ObjectId,
        ref: 'LaboratoryService',
      },
    },
  ],
  radiologyRequest: [
    {
      serviceId: {
        type: mongoose.Schema.ObjectId,
        ref: 'RadiologyService',
      },
    },
  ],
  dischargeRequest: {
    dischargeSummary: {
      dischargeNotes: {
        type: String,
      },
      otherNotes: {
        type: String,
      },
    },
    dischargeMedication: {
      date: {
        type: Date,
      },
      status: {
        type: String,
      },
      requester: {
        type: mongoose.Schema.ObjectId,
        ref: 'staff',
      },
      medicine: [
        {
          itemId: {
            type: mongoose.Schema.ObjectId,
            ref: 'Item',
          },
          priority: {
            type: String,
          },
          schedule: {
            type: String,
          },
          dosage: {
            type: Number,
          },
          frequency: {
            type: Number,
          },
          duration: {
            type: Number,
          },
          requestedQty: {
            type: Number,
          },
          medicineName: {
            type: String,
          },
          unitPrice: {
            type: Number,
          },
          totalPrice: {
            type: Number,
          },
          itemType: {
            type: String,
          },
          make_model: {
            type: String,
          },
          size: {
            type: String,
          },
        },
      ],
    },
    status: {
      type: String,
      default: 'pending',
    },
  },
  inPatientRequest: {},
  status: {
    type: String,
    default: 'pending',
  },
  verified: {
    type: Boolean,
  },
  insurerId: {
    type: mongoose.Schema.ObjectId,
    ref: 'insuranceVendors',
  },
  paymentMethod: {
    type: String,
  },
  claimed: {
    type: Boolean,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  createdTimeStamp: {
    type: Date,
    default: Date.now,
  },
  dischargeTimestamp: {
    type: Date,
    default: Date.now,
  },
});

edrSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('EDR', edrSchema);
