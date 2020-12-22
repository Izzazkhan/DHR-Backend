const payment = {
	//   "status" : "<code>", // R!  active | cancelled | draft | entered-in-error
	status: { type: String },
	//   "request" : { Reference(Any) }, // Request reference
	//   "response" : { Reference(Any) }, // Response reference
	created: { type: Date }, // R!  Creation date
	//   "provider" : { Reference(Practitioner|PractitionerRole|Organization) }, // Responsible practitioner
	provider: { type: String },
	payment: { type: String }, // R!  Payment reference enum: ["Uninsured", "Insured"]
	paymentDate: { type: Date }, // Payment or clearing date
	payee: { type: String }, // Party being paid
	recipient: { type: String }, // R!  Party being notified
	amount: { type: String }, // R!  Monetary amount of the payment
	paymentStatus: {
		type: String,
		// equilent to codeableconcept
	}, // Issued or cleared Status of the payment
};

module.exports = { payment };
