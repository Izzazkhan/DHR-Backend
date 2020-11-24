const requestNoFormat = require('dateformat');
const Pharm = require('../models/requests/pharm');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

exports.createPharmRequest = asyncHandler(async (req, res, next) => {
	// console.log(req.body);
	const now = new Date();
	const start = new Date(now.getFullYear(), 0, 0);
	const diff =
		now -
		start +
		(start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
	const oneDay = 1000 * 60 * 60 * 24;
	const day = Math.floor(diff / oneDay);
	const { subject, medication, dispenseRequest, dosage, status } = req.body;
	const medicationRequest = await Pharm.create({
		PharmRequestNo: 'Pharm' + day + requestNoFormat(new Date(), 'yyHHMM'),
		subject,
		medication,
		dispenseRequest,
		dosage,
		status,
	});
	res.status(201).json({
		success: true,
		data: medicationRequest,
	});
});

exports.getPharmRequest = asyncHandler(async (req, res, next) => {
	const options = {
		populate: [
			{
				path: 'subject',
			},
		],
		sort: { $natural: -1 },
	};
	const pharmRequest = await Pharm.paginate({ status: 'pending' }, options);
	res.status(200).json({
		success: true,
		data: pharmRequest,
	});
});
