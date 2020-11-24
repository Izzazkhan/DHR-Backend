const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const PharmacyRequestSchema = new mongoose.Schema({
	identifier: [{ value: String }],
	subject: {
		// PatientID
		type: mongoose.Schema.ObjectId,
		ref: 'patientfhir',
	},
	recorder: {
		type: mongoose.Schema.ObjectId,
		ref: 'staff',
		// Person who entered the request
	},
	performer: {
		type: mongoose.Schema.ObjectId,
		ref: 'staff',
		// Intended performer of administration
	},
	status: {
		type: String,
	},
	statusReason: {
		type: String,
		// Reason for current status
	},
	dispenseRequest: {
		initialFill: {
			type: String,
		},
		quantity: {
			type: Number,
		},
		duration: {
			type: String,
		},
	},
	dosage: {
		type: String,
	},
	PharmRequestNo: {
		type: String,
	},
	medication: [
		{
			serviceId: {
				type: mongoose.Schema.ObjectId,
				ref: 'PharmacyService',
			},
			medicationName: {
				type: String,
			},
			time: {
				type: String,
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
			requester: {
				type: mongoose.Schema.ObjectId,
				ref: 'staff',
			},
			results: {
				type: String,
			},
			note: {
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
			serviceType: {
				type: String,
			},
			date: {
				type: Date,
				default: Date.now,
			},
		},
	],
	authoredOn: {
		type: Date,
		default: Date.now,
	},
	updatedAt: {
		type: Date,
		default: Date.now,
	},
});

PharmacyRequestSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('PharmacyRequest', PharmacyRequestSchema);
