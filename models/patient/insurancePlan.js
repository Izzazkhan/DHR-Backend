const contact = require("./contact");
const insurancePlan = {
  resourceType: { type: String },
  // from Resource: id, meta, implicitRules, and language
  // from DomainResource: text, contained, extension, and modifierExtension
  identifier: { type: String }, // C? Business Identifier for Product
  status: { type: String, enum: ["draft", "active", "retired", "unknown"] }, // draft | active | retired | unknown
  type: [
    {
      type: String,

      // equilent to codeableconcept
    },
  ], // Kind of product
  name: { type: String }, // C? Official name
  coverageTerms: { type: String },
  coPayment: { type: Number },
  coveredFamilyMembers: [contact.contact],
  coverageDetails: { type: String },
  alias: [{ type: String }], // Alternate names
  //   period: [period.period], // When the product is available
  //   "ownedBy" : { Reference(Organization) }, // Plan issuer
  //   "administeredBy" : { Reference(Organization) }, // Product administrator
  //   "coverageArea" : [{ Reference(Location) }], // Where product applies
  //   contact: [
  //     {
  //       // Contact for the product
  //       purpose: { CodeableConcept }, // The type of contact
  //       name: { HumanName }, // A name associated with the contact
  //       telecom: [{ ContactPoint }], // Contact details (telephone, email, etc.)  for a contact
  //       address: { Address }, // Visiting or postal addresses for the contact
  //     },
  //   ],
  //   "endpoint" : [{ Reference(Endpoint) }], // Technical endpoint
  //   "network" : [{ Reference(Organization) }], // What networks are Included
  otherDetails: { type: String },
  insuranceDetails: { type: String },
  //   "plan" : [{ // Plan details
  //     "identifier" : [{ Identifier }], // Business Identifier for Product
  //     "type" : { CodeableConcept }, // Type of plan
  //     "coverageArea" : [{ Reference(Location) }], // Where product applies
  //     "network" : [{ Reference(Organization) }], // What networks provide coverage
  //     "generalCost" : [{ // Overall costs
  //       "type" : { CodeableConcept }, // Type of cost
  //       "groupSize" : "<positiveInt>", // Number of enrollees
  //       "cost" : { Money }, // Cost value
  //       "comment" : "<string>" // Additional cost information
  //     }],
  //     "specificCost" : [{ // Specific costs
  //       "category" : { CodeableConcept }, // R!  General category of benefit
  //       "benefit" : [{ // Benefits list
  //         "type" : { CodeableConcept }, // R!  Type of specific benefit
  //         "cost" : [{ // List of the costs
  //           "type" : { CodeableConcept }, // R!  Type of cost
  //           "applicability" : { CodeableConcept }, // in-network | out-of-network | other
  //           "qualifiers" : [{ CodeableConcept }], // Additional information about the cost
  //           "value" : { Quantity } // The actual cost value
  //         }]
  //       }]
  //     }]
  //   }]
};

module.exports = { insurancePlan };
