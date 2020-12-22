const mongoose = require('mongoose');

const RoomsSchema = new mongoose.Schema({
	roomId: { type: String },
	numberOfPatients: { type: Number },
	bed: [
		{
			cellNo: {
				type: Number,
			},
			patient: {
				type: mongoose.Schema.ObjectId,
				ref: 'patientfhir',
			},
			createdAt: {
				type: Date,
				default: Date.now,
			},
			updatedAt: {
				type: Date,
				default: Date.now,
			},
		},
	],
});

module.exports = mongoose.model('Rooms', RoomsSchema);
