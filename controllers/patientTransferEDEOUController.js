const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Staff = require('../models/staffFhir/staff');
const TransferToEDEOU = require('../models/patientTransferEDEOU/patientTransferEDEOU');
const Notification = require('../components/notification');
const EOU = require('../models/EOU');
const Bed = require('../models/Bed');
const Room = require('../models/room');

exports.getPendingTransferReqED = asyncHandler(async (req, res, next) => {
  const list = await TransferToEDEOU.find({
    from: 'ED',
    $or: [{ status: 'pending' }, { status: 'in_progress' }],
  }).populate([
    {
      path: 'edrId',
      model: 'EDR',
      select: 'patientId room chiefComplaint',
      populate: [
        {
          path: 'patientId',
          model: 'patientfhir',
          select: 'identifier name',
        },
        {
          path: 'room.roomId',
          model: 'room',
          select: 'roomNo ',
        },
        {
          path: 'chiefComplaint.chiefComplaintId',
          model: 'chiefComplaint',
          select: 'productionArea.productionAreaId',
          populate: {
            path: 'productionArea.productionAreaId',
            model: 'productionArea',
            select: 'paName',
          },
        },
        {
          path: 'newChiefComplaint.newChiefComplaintId',
          model: 'NewChiefComplaint',
        },
        {
          path: 'eouBed.bedId',
          model: 'Bed',
          select: 'bedId bedNo',
        },
      ],
    },
  ]);
  res.status(200).json({
    success: true,
    data: list,
  });
});
exports.getCompletedTransferReqED = asyncHandler(async (req, res, next) => {
  const list = await TransferToEDEOU.find({
    from: 'ED',
    status: 'completed',
  }).populate([
    {
      path: 'edrId',
      model: 'EDR',
      select: 'patientId room chiefComplaint',
      populate: [
        {
          path: 'patientId',
          model: 'patientfhir',
          select: 'identifier name',
        },
        {
          path: 'room.roomId',
          model: 'room',
          select: 'roomNo ',
        },
        {
          path: 'chiefComplaint.chiefComplaintId',
          model: 'chiefComplaint',
          select: 'productionArea.productionAreaId',
          populate: {
            path: 'productionArea.productionAreaId',
            model: 'productionArea',
            select: 'paName',
          },
        },
        {
          path: 'newChiefComplaint.newChiefComplaintId',
          model: 'NewChiefComplaint',
        },
        {
          path: 'eouBed.bedId',
          model: 'Bed',
          select: 'bedId bedNo',
        },
      ],
    },
  ]);
  res.status(200).json({
    success: true,
    data: list,
  });
});

exports.getTransferReqEOU = asyncHandler(async (req, res, next) => {
  const list = await TransferToEDEOU.find({
    from: 'EOU',
  }).populate([
    {
      path: 'edrId',
      model: 'EDR',
      select: 'patientId room chiefComplaint',
      populate: [
        {
          path: 'patientId',
          model: 'patientfhir',
          select: 'identifier name',
        },
        {
          path: 'room.roomId',
          model: 'room',
          select: 'roomNo ',
        },
        {
          path: 'chiefComplaint.chiefComplaintId',
          model: 'chiefComplaint',
          select: 'productionArea.productionAreaId',
          populate: {
            path: 'productionArea.productionAreaId',
            model: 'productionArea',
            select: 'paName',
          },
        },
        {
          path: 'newChiefComplaint.newChiefComplaintId',
          model: 'NewChiefComplaint',
        },
      ],
    },
  ]);
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
  const doctorPA = await Staff.findById(req.params.staffId)
    .select('chiefComplaint.chiefComplaintId')
    .populate([
      {
        path: 'chiefComplaint.chiefComplaintId',
        model: 'chiefComplaint',
        populate: [
          {
            path: 'productionArea.productionAreaId',
            model: 'productionArea',
            select: 'paName',
          },
        ],
      },
    ]);
  const latestCC = doctorPA.chiefComplaint.length - 1;

  const chiefComplaintId =
    doctorPA.chiefComplaint[latestCC].chiefComplaintId._id;
  const patients = await EDR.find({
    currentLocation: req.params.currentdept,
    status: 'pending',
    patientInHospital: true,
    room: { $ne: [] },
    'chiefComplaint.chiefComplaintId': chiefComplaintId,
  })
    .populate('patientId')
    .populate('chiefComplaint.chiefComplaintId')
    .populate('room.roomId')
    .populate('newChiefComplaint.newChiefComplaintId');

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
  const currentStaff = await Staff.findById(req.params.staffId).select('shift');

  const customerCares = await Staff.find({
    staffType: 'Customer Care',
    disabled: false,
    shift: currentStaff.shift,
  });
  res.status(201).json({
    success: true,
    data: customerCares,
  });
});

exports.assignCC = asyncHandler(async (req, res, next) => {
  const customerCareStaff = await Staff.findOne({ _id: req.body.ccId });

  if (!customerCareStaff || customerCareStaff.disabled === true) {
    return next(
      new ErrorResponse(
        'Could not assign Chief Complaint to this Customer Care',
        400
      )
    );
  }

  // Nurse Technician Request
  const currentStaff = await Staff.findById(req.body.staffId).select('shift');

  const nurseTechnicians = await Staff.find({
    disabled: false,
    staffType: 'Nurses',
    subType: 'Nurse Technician',
    shift: currentStaff.shift,
  });
  const randomNurse = Math.floor(Math.random() * (nurseTechnicians.length - 1));

  const nurseTechnician = nurseTechnicians[randomNurse];

  if (!nurseTechnician) {
    return next(new ErrorResponse('No Nurse Technician Available this Time'));
  }

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

  // const customerCare = {
  //   assignedBy: req.body.assignedBy,
  //   customerCareId: req.body.ccId,
  //   assignedTime: Date.now(),
  //   reason: req.body.reason,
  // };
  const assignedCC = await TransferToEDEOU.findOneAndUpdate(
    {
      _id: req.body.transferId,
    },
    { $set: { requestedTo: req.body.ccId, requestedAt: Date.now() } },
    { $new: true }
  );

  // const transfer = await TransferToEDEOU.findById(req.body.transferId);

  // if (transfer.to === 'ED' && transfer.from === 'EOU') {
  //   const checkRoom = await Room.findOne({ _id: req.body.roomId });
  //   if (
  // checkRoom! ||
  //     checkRoom.disabled === true ||
  //     checkRoom.availability === false
  //   ) {
  //     return next(
  //       new ErrorResponse('The Room you are assigning is not available', 400)
  //     );
  //   }

  //   let bedId = await Room.findById(req.body.roomId).select('beds');
  //   bedId = bedId.beds[0].bedIdDB;
  //   const bed = await Bed.findOne({ _id: bedId });

  //   if (bed.disabled === true) {
  //     return next(
  //       new ErrorResponse(
  //         'Bed in this room is disabled,you cannot assign it',
  //         400
  //       )
  //     );
  //   }
  //   const room = {
  //     roomId: req.body.roomId,
  //     bedId: bed._id,
  //     edrId: req.body.edrId,
  //     assignedBy: req.body.staffId,
  //     assignedTime: Date.now(),
  //     reason: req.body.reason,
  //   };

  //   const patient = await EDR.findOneAndUpdate(
  //     { _id: req.body.edrId },
  //     { $push: { room } },
  //     { new: true }
  //   )
  //     .select('patientId')
  //     .populate('patientId', 'identifier');

  //   if (!patient) {
  //     return next(new ErrorResponse('patient not found with this id', 400));
  //   }
  // }

  // if (transfer.to === 'EOU' && transfer.from === 'ED') {
  const bed = await Bed.findOne({ _id: req.body.bedId });

  if (!bed || bed.disabled === true) {
    return next(
      new ErrorResponse('The bed you are assigning is not available', 400)
    );
  }

  const eouBed = {
    bedId: req.body.bedId,
    assignedBy: req.body.staffId,
    assignedTime: Date.now(),
  };
  await EDR.findOneAndUpdate(
    { _id: req.body.edrId },
    { $push: { eouBed } },
    { new: true }
  );

  Notification(
    'ADT_A15',
    'Transfer Patient From ED to EOU',
    'Customer Care',
    'Transfer To EOU',
    '/dashboard/home/taskslistforcustomercare',
    req.body.edrId,
    '',
    ''
  );

  // }
  // const assignedCC = await EDR.findOneAndUpdate(
  //   { _id: req.body.edrId },
  //   { $push: { customerCare } },
  //   {
  //     new: true,
  //   }
  // );

  res.status(200).json({
    success: true,
    data: assignedCC,
  });
});

exports.addTransferRequest = asyncHandler(async (req, res, next) => {
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

  const patientTransferReqObj = {
    edrId: req.body.edrId,
    to: req.body.to,
    from: req.body.from,
    requestedBy: req.body.staffId,
    status: 'pending',
  };

  const transferRequest = await TransferToEDEOU.create(patientTransferReqObj);

  Notification(
    'ADT_A02',
    'Patient Transfer has been initiated by doctor',
    'Sensei',
    'Transfer To EOU',
    '/dashboard/home/patientmanagement/transferrequests/EOUfromED',
    req.body.edrId,
    '',
    ''
  );

  Notification(
    'ADT_A15',
    'Patient Transfer to EOU',
    'Nurses',
    'ED Doctor',
    '/dashboard/home/notes',
    req.body.edrId,
    '',
    'ED Nurse'
  );

  res.status(200).json({
    success: true,
    data: transferRequest,
  });
});
