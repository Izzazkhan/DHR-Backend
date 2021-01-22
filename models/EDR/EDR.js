const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const edrSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.ObjectId,
    ref: 'patientfhir',
  },
  transfer: [
    {
      reason: String,
      status: String,
      transferTime: Date,
      transferBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'staff',
      },
    },
  ],
  careStream: [
    {
      careStreamId: {
        type: mongoose.Schema.ObjectId,
        ref: 'careStream',
      },
      versionNo: {
        type: String,
      },
      assignedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'staff',
      },
      assignedTime: {
        type: Date,
      },
      reason: String,
      name: {
        type: String,
      },
      inclusionCriteria: [{ type: String }],
      exclusionCriteria: [{ type: String }],
      investigations: [{ type: String }],
      precautions: [{ type: String }],
      treatmentOrders: [
        {
          name: String,
          subType: [
            {
              type: String,
            },
          ],
        },
      ],
      fluidsIV: [
        {
          type: String,
        },
      ],
      medications: [
        {
          type: String,
        },
      ],
      mdNotification: [
        {
          name: String,
          subType: [
            {
              type: String,
            },
          ],
        },
      ],
      status: {
        type: String,
      },
    },
  ],
  room: [
    {
      roomId: {
        type: mongoose.Schema.ObjectId,
        ref: 'room',
      },
      // bedId: {
      //   type: mongoose.Schema.ObjectId,
      //   ref: 'room',
      // },
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
  dcdForm: [
    {
      versionNo: {
        type: String,
      },
      triageAssessment: [
        {
          triageRequestNo: { type: String },
          status: { type: String, default: 'pending' },
          reason: { type: String },
          weight: { type: String },
          bloodSugarLevel: { type: String },
          heartRate: { type: String },
          bloodPressureSys: { type: String },
          bloodPressureDia: { type: String },
          respiratoryRate: { type: String },
          temperature: { type: String },
          FSBS: { type: String },
          painScale: { type: String },
          pulseOX: { type: String },
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
          triageTime: {
            type: Date,
          },
        },
      ],
      investigation: [
        {
          version: String,
          status: String,
          reason: String,
          date: Date,
          updatedBy: {
            type: mongoose.Schema.ObjectId,
            ref: 'staff',
          },
          details: [
            {
              name: String, // Rhythm ECG
              chips: [
                {
                  name: String, // NSR // Rate
                  image: [{ type: String }], // multiple images
                  detail: String, // Rate's Textfield
                },
              ],
              Texts: [
                //for rows such as CBC, Chemistries, UA
                {
                  name: String,
                  value: String,
                },
              ],
            },
          ],
        },
      ],
      pastMedicalHistory: [
        {
          version: String,
          status: String,
          reason: String,
          date: Date,
          updatedBy: {
            type: mongoose.Schema.ObjectId,
            ref: 'staff',
          },
          details: [
            {
              name: String, // for e.g. Past History
              chips: [
                {
                  name: String, // for e.g. Neurological Problems
                  detail: String, // Neurological Problems Textfield
                  subChips: [
                    // Neurological Problems SubChips
                    {
                      name: String, // e.g. CVA
                      selected: Boolean, // to mark it as selected
                    },
                  ],
                  List: [
                    {
                      name: String, // for rows such as 'Medications' & 'Allergies' which has 'See list' Option
                    },
                  ],
                },
              ],
              Texts: [
                //for rows which have only Text e.g. Family HX
                {
                  name: String,
                  value: String,
                },
              ],
            },
          ],
        },
      ],
      ROS: [
        {
          version: String,
          status: String,
          reason: String,
          date: Date,
          updatedBy: {
            type: mongoose.Schema.ObjectId,
            ref: 'staff',
          },
          details: [
            {
              name: String, // row names e.g. CONST
              chips: [
                {
                  name: String, // Chips of rows
                },
              ],
            },
          ],
        },
      ],
      actionPlan: [
        {
          version: String,
          status: String,
          reason: String,
          date: Date,
          updatedBy: {
            type: mongoose.Schema.ObjectId,
            ref: 'staff',
          },
          details: [
            {
              name: String, // row name
              chips: [
                {
                  name: String, // chip's name
                  detail: String, // chip's Textfield
                },
              ],
            },
          ],
        },
      ],
      courseOfVisit: [
        {
          version: String,
          status: String,
          reason: String,
          date: Date,
          updatedBy: {
            type: mongoose.Schema.ObjectId,
            ref: 'staff',
          },
          details: [
            {
              name: String, // row name
              Texts: [
                // Textfield for a row
                {
                  name: String,
                  value: String,
                },
              ],
              chips: [
                {
                  name: String, // chip's name
                  detail: String, // chip's Textfield
                },
              ],
            },
          ],
        },
      ],
      patientDetails: [
        {
          version: String,
          status: String,
          reason: String,
          date: Date,
          updatedBy: {
            type: mongoose.Schema.ObjectId,
            ref: 'staff',
          },
          details: [
            {
              name: String, // row name e.g Historian
              value: Number,
              Texts: [
                // Textfields in place of rows
                {
                  name: String,
                  value: String,
                },
              ],
              DropDowns: [
                //	Dropdown in details form
                {
                  name: String,
                  value: String,
                },
              ],
              chips: [
                {
                  name: String, // chip's name
                  detail: String, // chip's Textfield
                },
              ],
            },
          ],
        },
      ],
      physicalExam: [
        {
          version: String,
          status: String,
          reason: String,
          date: Date,
          updatedBy: {
            type: mongoose.Schema.ObjectId,
            ref: 'staff',
          },
          details: [
            {
              name: String, // row name e.g Physical Exam
              scale: {
                // rows having scale e.g pain scale
                name: String,
                value: Number,
              },
              chips: [
                {
                  name: String, // Chip names e.g. Agree W/ Vital Sign
                  image: [{ type: String }], // multiple images
                  detail: String, // Chips's Textfield
                  right: [
                    //  Chips further having Right side Details
                    {
                      name: String,
                      value: String,
                    },
                  ],
                  left: [
                    //  Chips further having Left side Details
                    {
                      name: String,
                      value: String,
                    },
                  ],
                  subChips: [
                    // Chips with SubChips e.g abnormal bowel sounds
                    {
                      name: String, // e.g. absent, inc, dec
                      selected: Boolean, // to mark it as selected
                    },
                  ],
                },
              ],
            },
          ],
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

  doctorNotes: [
    {
      notes: String,
      addedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'staff',
      },
      voiceNotes: String,
      assignedTime: Date,
      code: [{ type: String }],
      section: String,
    },
  ],

  consultationNote: [
    {
      consultationNo: {
        type: String,
      },
      notes: String,
      addedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'staff',
      },
      voiceNotes: String,
      consultant: {
        type: mongoose.Schema.ObjectId,
        ref: 'staff',
      },
      noteTime: {
        type: Date,
      },
      status: {
        type: String,
        default: 'pending',
      },
      speciality: {
        type: String,
      },
      consultantNotes: {
        type: String,
      },
      completionDate: {
        type: Date,
      },
      consultantVoiceNotes: {
        type: String,
      },
    },
  ],
  anesthesiologistNote: [
    {
      anesthesiologistNo: {
        type: String,
      },
      notes: String,
      addedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'staff',
      },
      voiceNotes: String,
      anesthesiologist: {
        type: mongoose.Schema.ObjectId,
        ref: 'staff',
      },
      noteTime: {
        type: Date,
      },
      status: {
        type: String,
        default: 'pending',
      },
      suggessions: {
        type: String,
      },
      delayReason: {
        type: String,
      },
      completionTime: {
        type: Date,
      },
      delayTime: {
        type: Date,
      },
    },
  ],
  edNurseRequest: [
    {
      requestNo: {
        type: String,
      },
      notes: String,
      addedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'staff',
      },
      voiceNotes: String,
      edNurseId: {
        type: mongoose.Schema.ObjectId,
        ref: 'staff',
      },
      requestedAt: {
        type: Date,
      },
      status: {
        type: String,
        default: 'pending',
      },
      speciality: {
        type: String,
      },
    },
  ],
  eouNurseRequest: [
    {
      requestNo: {
        type: String,
      },
      notes: String,
      addedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'staff',
      },
      voiceNotes: String,
      eouNurseId: {
        type: mongoose.Schema.ObjectId,
        ref: 'staff',
      },
      requestedAt: {
        type: Date,
      },
      status: {
        type: String,
        default: 'pending',
      },
      speciality: {
        type: String,
      },
    },
  ],

  nurseTechnicianRequest: [
    {
      requestNo: {
        type: String,
      },
      notes: String,
      addedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'staff',
      },
      voiceNotes: String,
      nurseTechnicianId: {
        type: mongoose.Schema.ObjectId,
        ref: 'staff',
      },
      requestedAt: {
        type: Date,
      },
      status: {
        type: String,
        default: 'pending',
      },
      speciality: {
        type: String,
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
    // {
    //   type: mongoose.Schema.ObjectId,
    //   ref: 'pharmacyRequest',
    // },
    {
      pharmacyRequestNo: {
        type: String,
      },

      requestedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'staff',
      },

      pharmacist: {
        type: mongoose.Schema.ObjectId,
        ref: 'staff',
      },

      reconciliationNotes: [
        {
          pharmacistComments: {
            type: String,
          },

          requesterComments: {
            type: String,
          },

          pharmacistAudioNotes: {
            type: String,
          },

          createdAt: {
            type: Date,
            default: Date.now,
          },

          updatedAt: {
            type: Date,
            default: Date.now,
          },

          createdBy: {
            type: mongoose.Schema.ObjectId,
            ref: 'staff',
          },
        },
      ],

      item: [
        {
          itemId: {
            type: mongoose.Schema.ObjectId,
            ref: 'Item',
          },
          itemType: {
            type: String,
          },
          itemName: {
            type: String,
          },
          requestedQty: {
            type: Number,
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
          form: {
            type: String,
          },
          size: { type: String },
          make_model: { type: String },
          additionalNotes: { type: String },
        },
      ],
      status: {
        type: String,
      },
      secondStatus: {
        type: String,
      },

      deliveredTime: {
        type: Date,
      },

      createdAt: {
        type: Date,
        default: Date.now,
      },

      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  labRequest: [
    {
      serviceId: {
        type: mongoose.Schema.ObjectId,
        ref: 'LaboratoryService',
      },
      requestId: {
        type: String,
      },
      name: {
        type: String,
      },
      type: {
        type: String,
      },
      price: {
        type: Number,
      },
      image: [{ type: String }],
      status: {
        type: String,
        default: 'pending',
      },
      priority: {
        type: String,
      },
      requestedAt: {
        type: Date,
      },
      requestedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'staff',
      },
      notes: {
        type: String,
      },
      activeTime: {
        type: Date,
      },
      completeTime: {
        type: Date,
      },
      holdTime: {
        type: Date,
      },
      delayedReason: {
        type: String,
      },
      voiceNotes: {
        type: String,
      },
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
  radRequest: [
    {
      serviceId: {
        type: mongoose.Schema.ObjectId,
        ref: 'RadiologyService',
      },
      requestId: {
        type: String,
      },
      name: {
        type: String,
      },
      voiceNotes: {
        type: String,
      },
      type: {
        type: String,
      },
      price: {
        type: Number,
      },
      image: [{ type: String }],
      status: {
        type: String,
        default: 'pending',
      },
      priority: {
        type: String,
      },
      requestedAt: {
        type: Date,
      },
      requestedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'staff',
      },
      notes: {
        type: String,
      },
      activeTime: {
        type: Date,
      },
      completeTime: {
        type: Date,
      },
      holdTime: {
        type: Date,
      },
      pendingApprovalTime: {
        type: Date,
      },
      delayedReason: {
        type: String,
      },
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
  dischargeRequest: {
    dischargeSummary: {
      dischargeNotes: {
        type: String,
      },
      followUpInstruction: {
        type: String,
      },
      edrCompletionReason: {
        type: String,
      },
      edrCompletionRequirement: {
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
  socialWorkerStatus: {
    type: String,
    default: 'pending',
  },
  requiredAssistance: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'staff',
    },
  ],
  currentLocation: {
    type: String,
    default: 'ED',
  },
  transferOfCare: [
    {
      nurseTechnicianId: {
        type: mongoose.Schema.ObjectId,
        ref: 'staff',
      },
      diseaseName: String,
      fever: String,
      sugarLevel: Number,
      bloodPressure: String,
      cbcLevel: String,
    },
  ],
  nurseTechnicianStatus: {
    type: String,
  },
  survey: [
    {
      data: [
        {
          key: String,
          value: [{ name: String, value: String }],
          text: String,
        },
      ],
      surveyTime: Date,
    },
  ],
});

edrSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('EDR', edrSchema);
