const mongoose = require('mongoose');

const dcdFormSchema = mongoose.Schema({
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
      name: String, // for e.g. Past History
      chips: [
        {
          name: String, // for e.g. Neurological Problems
          detail: String, // Neurological Problems Textfield
          subChips: [
            // Neurological Problems SubChips
            {
              name: String, // e.g. CVA
              selected: boolean, // to mark it as selected
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
  versionNo: {
    type: String,
  },
  patientID: {
    type: mongoose.Schema.ObjectId,
    ref: 'patient',
    required: [true, 'Patient Id is required'],
  },
});
module.exports = mongoose.model('dcdForm', dcdFormSchema);
