const mongoose = require('mongoose');

const dcdFormSchema = mongoose.Schema({
  patientID: {
    type: mongoose.Schema.ObjectId,
    ref: 'patient',
    required: [true, 'Patient Id is required'],
  },
  weight: {
    type: Number,
  },
  bloodPressure: {
    type: String,
  },
  temperature: {
    type: String,
  },
  bloodSugar: {
    type: String,
  },
  bloodOxygen: {
    type: String,
  },
  generalAppearance: {
    type: String,
  },
  headNeck: {
    type: String,
  },
  respiratory: {
    type: String,
  },
  cardiac: {
    type: String,
  },
  abdomen: {
    type: String,
  },
  neuroLogical: {
    type: String,
  },
  staffId: {
    type: mongoose.Schema.ObjectId,
  },
  triageLevel: {
    type: String,
  },
  timeStamp: {
    type: Date,
    default: Date.now,
  },
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
  timeSeen: {
    type: Date,
    // Date wil come from front End
  },
  room: {
    type: Number,
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
});

module.exports = mongoose.model('dcdForm', dcdFormSchema);
