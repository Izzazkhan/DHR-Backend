const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const edrSchema = new mongoose.Schema({
	patientId: {
		type: mongoose.Schema.ObjectId,
		ref: 'patientfhir',
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
			speciality: {
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
			ref: 'ReplenishmentRequestBU',
		},
	],
	labRequest: [
		{
			serviceId: {
				type: mongoose.Schema.ObjectId,
				ref: 'LaboratoryService',
			},
			requester: {
				type: mongoose.Schema.ObjectId,
				ref: 'staff',
			},
		},
	],
	radiologyRequest: [
		{
			serviceId: {
				type: mongoose.Schema.ObjectId,
				ref: 'RadiologyService',
			},
			requester: {
				type: mongoose.Schema.ObjectId,
				ref: 'staff',
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
	triageAssessment: [
		{
			requester: {
				type: mongoose.Schema.ObjectId,
				ref: 'staff',
			},
		},
	],
	requestType: {
		type: String,
		default: 'EDR',
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
