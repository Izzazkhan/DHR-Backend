const Rooms = require('../models/productionArea/rooms');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

exports.assignRoom = asyncHandler(async (req, res, next) => {
	// console.log(req.body);;
	const { roomId, numberOfPatients, bed } = req.body;
	const assignedRoom = await Rooms.create({
		roomId,
		numberOfPatients,
		bed,
	});
	res.status(201).json({
		success: true,
		data: assignedRoom,
	});
});
