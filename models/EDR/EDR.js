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
  room: [
    {
      roomId: {
        type: mongoose.Schema.ObjectId,
        ref: 'room',
      },
      bedId: {
        type: mongoose.Schema.ObjectId,
        ref: 'room',
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
          name: String, // row names e.g. CONST
          chips: [
            {
              name: String, // Chips of rows
            },
          ],
        },
      ],
      actionPlan: [
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
      courseOfVisit: [
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
