const requestNoFormat = require('dateformat');
const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Staff = require('../models/staffFhir/staff');
const TransferToEDEOU = require('../models/patientTransferEDEOU/patientTransferEDEOU');
const Notification = require('../components/notification');

exports.getTransferReqED = asyncHandler(async (req, res, next) => {
  const list = await TransferToEDEOU.find({
    from: 'ED',
  });
  res.status(200).json({
    success: true,
    data: list,
  });
});

exports.getTransferReqEOU = asyncHandler(async (req, res, next) => {
  const list = await TransferToEDEOU.find({
    from: 'EOU',
  });
  res.status(200).json({
    success: true,
    data: list,
  });
});

exports.getTransferReqEDForCC = asyncHandler(async (req, res, next) => {
  const list = await TransferToEDEOU.find({
    from: 'ED',
    requestedTo: req.params.staffId,
  });
  res.status(200).json({
    success: true,
    data: list,
  });
});

exports.getTransferReqEOUForCC = asyncHandler(async (req, res, next) => {
  const list = await TransferToEDEOU.find({
    from: 'EOU',
    requestedTo: req.params.staffId,
  });
  res.status(200).json({
    success: true,
    data: list,
  });
});

exports.getTransferReqEDForRequester = asyncHandler(async (req, res, next) => {
  const list = await TransferToEDEOU.find({
    from: 'ED',
    requestedBy: req.params.staffId,
  });
  res.status(200).json({
    success: true,
    data: list,
  });
});

exports.getTransferReqEOUForRequester = asyncHandler(async (req, res, next) => {
  const list = await TransferToEDEOU.find({
    from: 'EOU',
    requestedBy: req.params.staffId,
  });
  res.status(200).json({
    success: true,
    data: list,
  });
});

exports.getAllTransferReqForRequester = asyncHandler(async (req, res, next) => {
  const list = await TransferToEDEOU.find({
    requestedBy: req.params.staffId,
  })
    .populate('requestedTo')
    .populate({ path: 'edrId', populate: { path: 'patientId' } })
    .populate({
      path: 'edrId',
      populate: { path: 'chiefComplaint.chiefComplaintId' },
    })
    .populate({
      path: 'edrId',
      populate: { path: 'room.roomId' },
    })
    .select({ edrId: 1, status: 1, to: 1, from: 1 });
  res.status(200).json({
    success: true,
    data: list,
  });
});

exports.patientsInDept = asyncHandler(async (req, res, next) => {
  let patients = await EDR.find({
    currentLocation: req.params.currentdept,
    status: 'pending',
    patientInHospital: true,
    room: { $ne: [] },
  })
    .populate('patientId')
    .populate('chiefComplaint.chiefComplaintId')
    .populate('room.roomId');

  // let response = [];
  // for (let i = 0; i < patients.length; i++) {
  //   if (patients[i].rooms.length > 0) {
  //     response.push(patients[i]);
  //   }
  // }

  res.status(200).json({
    success: true,
    data: patients,
  });
});

exports.getAllCustomerCares = asyncHandler(async (req, res, next) => {
  const customerCares = await Staff.find({
    staffType: 'Customer Care',
    disabled: false,
  });
  res.status(201).json({
    success: true,
    data: customerCares,
  });
});

exports.assignCC = asyncHandler(async (req, res, next) => {
  const customerCareStaff = await Staff.findOne({ _id: req.body.staffId });

  const transfer = await TransferToEDEOU.find({
    edrId: req.body.edrId,
    $or: [{ status: 'pending' }, { status: 'in_progress' }],
  });

  if (transfer.length > 0) {
    return res.status(200).json({
      success: false,
      error: 'Transfer request is already in progress for that patient',
    });
  }
  if (!customerCareStaff || customerCareStaff.disabled === true) {
    return next(
      new ErrorResponse(
        'Could not assign Chief Complaint to this Customer Care',
        400
      )
    );
  }

  // await Staff.findOneAndUpdate(
  //   { _id: customerCareStaff.id },
  //   { $set: { availability: false } },
  //   { new: true }
  // );

  // Nurse Technician Request
  const nurseTechnician = await Staff.findOne({
    // availability: true,
    disabled: false,
    staffType: 'Nurses',
    subType: 'Nurse Technician',
  });
  if (!nurseTechnician) {
    return next(new ErrorResponse('No Nurse Technician Available this Time'));
  }

  // console.log(nurseTechnician._id);
  const nurseId = {
    nurseTechnicianId: nurseTechnician._id,
    status: 'To Be Observed',
    transferTime: Date.now(),
  };

  await EDR.findOneAndUpdate(
    { _id: req.body.edrId },
    { $push: { transferOfCare: nurseId } },
    { new: true }
  );

  // await EDR.findOneAndUpdate(
  //   { _id: req.body.edrId },
  //   { $set: { nurseTechnicianStatus: 'pending' } },
  //   { new: true }
  // );

  const customerCare = {
    assignedBy: req.body.assignedBy,
    customerCareId: req.body.staffId,
    assignedTime: Date.now(),
    reason: req.body.reason,
  };

  const patientTransferReqObj = {
    edrId: req.body.edrId,
    to: req.body.to,
    from: req.body.from,
    requestedBy: req.body.assignedBy,
    requestedTo: req.body.staffId,
    status: 'pending',
  };

  const tReqObj = await TransferToEDEOU.create(patientTransferReqObj);

  const assignedCC = await EDR.findOneAndUpdate(
    { _id: req.body.edrId },
    { $push: { customerCare } },
    {
      new: true,
    }
  );
  if (req.body.to === 'EOU' && req.body.from === 'ED') {
    Notification(
      'ADT_A15',
      'Patient has been transferred to EOU',
      'Customer Care',
      'Transfer To EOU',
      '/home/rcm/patientAssessment',
      req.body.edrId,
      ''
    );
  }

  res.status(200).json({
    success: true,
    data: assignedCC,
  });
});
