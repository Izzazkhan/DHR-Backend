const mongoose = require('mongoose');
const CareStreamSchema = new mongoose.Schema(
	{
		name: {
			type: String,
		},
		inclusionCriteria: [
			{
				name: {
					type: String,
				},
			},
		],
		exclusionCriteria: [
			{
				name: {
					type: String,
				},
			},
		],
		investigation: [
			{
				name: {
					type: String,
				},
			},
		],
		precaution: [
			{
				name: {
					type: String,
				},
			},
		],
		treatmentOrders: [
			{
				name: {
					type: String,
				},
			},
		],
		fluidsIV: [
			{
				name: {
					type: String,
				},
			},
		],
		medications: [
			{
				name: {
					type: String,
				},
			},
		],
		mdNotification: [
			{
				name: {
					type: String,
				},
			},
		],
		status: {
			type: String,
		},
		productionArea: {
			type: mongoose.Schema.ObjectId,
			ref: 'ProductionArea',
		},
		patient: {
			type: mongoose.Schema.ObjectId,
			ref: 'patient',
		},
	},
	{
		timestamps: true,
	}
);
module.exports = mongoose.model('careStream', CareStreamSchema);
