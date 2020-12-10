const mongoose = require('mongoose');
const period = require('../patient/common/period');
const telecom = require('../patient/contactPoint');

const careTeamSchema = new mongoose.Schema({
  identifier: [
    {
      value: { type: String },
    },
  ],
  status: {
    type: String,
    //   proposed | active | suspended | inactive |
  },
  category: [
    {
      text: {
        type: String,
        //   Type of team
      },
    },
  ],
  name: {
    type: String,
    //   Name of the team, such as crisis assessment team
  },
  subject: {
    type: mongoose.Schema.ObjectId,
    ref: 'patientFhir',
    //   Who care team is for
  },
  encounter: {
    type: String,
    // ref:encounter
    //   The Encounter during which this CareTeam was created or to which the creation of this record is tightly associated.
  },
  period: period.period,
  participant: [
    //   Members of the team
    {
      role: [
        // Type of involvement
        {
          text: {
            type: String,
          },
        },
      ],
      member: {
        //   Who is involved
        type: mongoose.Schema.ObjectId,
        //   Reference(Practitioner | PractitionerRole | RelatedPerson | Patient | Organization | CareTeam)
      },
      onBehalfOf: {
        type: mongoose.Schema.ObjectId,
        // Reference(Organization)	Organization of the practitioner
        // CareTeam.participant.onBehalfOf can only be populated when CareTeam.participant.member is a Practitioner
      },
      period: period.period,
    },
  ],
  reasonCode: [
    //   Why the care team exists
    {
      text: {
        type: String,
      },
    },
  ],
  reasonReference: [
    {
      type: String,
      // Reference(Condition)	Why the care team exists
    },
  ],
  managingOrganization: [
    {
      type: String,
      //   Reference(Organization)	Organization responsible for the care team
    },
  ],
  telecom: [telecom.contactPoint],
  note: [
    {
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
  ],
});

module.exports = mongoose.model('CareTeam', careTeamSchema);
