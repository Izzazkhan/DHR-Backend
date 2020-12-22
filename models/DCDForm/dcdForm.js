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
  medicationHistory: {
    name: String,
    description: String,
    image: String,
  },
  allergies: {
    name: String,
    description: String,
  },
  // socialHX: [
  //   {
  //     name: String,
  //     detail: {
  //       text: String,
  //       subTypes: [
  //         {
  //           type: String,
  //         },
  //       ],
  //     },
  //   },
  // ],
  // familyHX: {
  //   type: String,
  // },
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
  investigation: [
    {
      name: String, // Rhythm ECG
      chips: [
        {
          name: String, // NSR // Rate
          image: [{ type: String }], // multiple images
          detail: String // Rate's Textfield
        },
      ],
      Texts: [ 		//for rows such as CBC, Chemistries, UA
        {
          name: String,
          value: String
        }
      ],
    },
  ],
  pastMedicalHistory: [
    {
      name: String,	// for e.g. Past History 
      chips: [
        {
          name: String,	// for e.g. Neurological Problems
          detail: String,	// Neurological Problems Textfield
          subChips: [		// Neurological Problems SubChips 
            {
              name: String,	// e.g. CVA
              selected: boolean	// to mark it as selected
            },
          ],
          List: [
            {
              name: String	// for rows such as 'Medications' & 'Allergies' which has 'See list' Option
            }
          ]
        }
      ],
      Texts: [ 		//for rows which have only Text e.g. Family HX
        {
          name: String,
          value: String
        }
      ],
    },
  ],
  ROS: [
    {
      name: String,		// row names e.g. CONST
      chips: [
        {
          name: String	// Chips of rows
        }
      ]
    }
  ],
  actionPlan: [
    {
      name: String,		// row name
      chips: [
        {
          name: String,	// chip's name
          detail: String	// chip's Textfield
        }
      ]
    }
  ],
  courseOfVisit: [
    {
      name: String,		// row name
      Texts: [ 		// Textfield for a row
        {
          name: String,
          value: String
        }
      ],
      chips: [
        {
          name: String,	// chip's name
          detail: String	// chip's Textfield
        }
      ]
    }
  ],
  patientDetails: [
    {
      name: String,		// row name e.g Historian
      Texts: [ 		// Textfields in place of rows
        {
          name: String,
          value: String
        }
      ],
      DropDowns: [		//	Dropdown in details form
        {
          name: String,
          value: String
        }
      ],
      chips: [
        {
          name: String,	// chip's name
          detail: String	// chip's Textfield
        }
      ]
    }
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
});
module.exports = mongoose.model('dcdForm', dcdFormSchema);