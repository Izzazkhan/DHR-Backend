const requestNoFormat = require('dateformat');
const patientFHIR = require('../models/patient/patient');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

exports.registerPatient = asyncHandler(async (req, res) => {
	// console.log(req.body);
	const now = new Date();
	const start = new Date(now.getFullYear(), 0, 0);
	const diff =
		now -
		start +
		(start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
	const oneDay = 1000 * 60 * 60 * 24;
	const day = Math.floor(diff / oneDay);
	const MRN = [
		{
			value: 'khmc' + day + requestNoFormat(new Date(), 'yyHHMMss'),
		},
	];
	const {
		nationalID,
		name,
		gender,
		birthDate,
		age,
		height,
		weight,
		telecom,
		address,
		country,
		city,
		nationality,
		blood,
		photo,
		idCardFront,
		idCardBack,
		otherDetails,
		contact,
		paymentMethod,
		insuranceNumber,
		insuranceVendor,
		coverageTerms,
		coPayment,
		coveredFamilyMember,
		coverageDetails,
		insuranceDetails,
		insuranceCard,
		claimed,
		status,
	} = req.body;

	const newPatient = await patientFHIR.create({
		identifier: MRN,
		nationalID,
		name,
		gender,
		birthDate,
		age,
		height,
		weight,
		telecom,
		address,
		country,
		city,
		nationality,
		blood,
		photo,
		idCardFront,
		idCardBack,
		otherDetails,
		contact,
		paymentMethod,
		insuranceNumber,
		insuranceVendor,
		coverageTerms,
		coPayment,
		coveredFamilyMember,
		coverageDetails,
		insuranceDetails,
		insuranceCard,
		claimed,
		status,
	});
	res.status(201).json({
		success: true,
		data: newPatient,
	});
});

exports.deletePatient = asyncHandler(async (req, res, next) => {
	const patient = await patientFHIR.findByIdAndRemove(req.params.patientId);
	if (!patient) {
		return next(new ErrorResponse('No patient Found with this id', 404));
	}
	res.status(204).json({
		status: 'Success',
		data: null,
	});
});

exports.updatePatient = asyncHandler(async (req, res, next) => {
	const newPatient = await patientFHIR.findByIdAndUpdate(
		req.params.patientId,
		req.body,
		{
			runValidators: true,
			new: true,
		}
	);

	if (!newPatient) {
		return next(new ErrorResponse('No patient Found with this id', 404));
	}

	res.status(200).json({
		success: true,
		data: newPatient,
	});
});

exports.getPatient = asyncHandler(async (req, res, next) => {
	const patient = await patientFHIR.findById(req.params.patientId);
	if (!patient) {
		return next(new ErrorResponse('No patient Found with this id', 404));
	}
	res.status(200).json({
		success: true,
		data: patient,
	});
});

exports.getAllPatients = asyncHandler(async (req, res) => {
	const patients = await patientFHIR.paginate();
	res.status(200).json({
		success: true,
		data: patients,
	});
});

exports.getPendingRegistration = asyncHandler(async (req, res, next) => {
	const pendingPatients = await patientFHIR.paginate({ status: 'pending' });
	res.status(200).json({
		success: true,
		data: pendingPatients,
	});
});

exports.getApprovedRegistration = asyncHandler(async (req, res, next) => {
	const approvedPatients = await patientFHIR.paginate({ status: 'approved' });
	res.status(200).json({
		success: true,
		data: approvedPatients,
	});
});
