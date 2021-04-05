const mongoose = require('mongoose');
const Staff = require('../models/staffFhir/staff');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const EDR = require('../models/EDR/EDR');
const Room = require('../models/room');
const Transfer = require('../models/patientTransferEDEOU/patientTransferEDEOU');
const CCRequest = require('../models/customerCareRequest');
const Notification = require('../components/notification');
// const Assistance = require('../models/assistance/assistance');

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
  if (!customerCareStaff || customerCareStaff.disabled === true) {
    return next(
      new ErrorResponse(
        'Could not assign Chief Complaint to this Customer Care',
        400
      )
    );
  }
  await Staff.findOneAndUpdate(
    { _id: customerCareStaff.id },
    { $set: { availability: false } },
    { new: true }
  );
  const customerCare = {
    assignedBy: req.body.assignedBy,
    customerCareId: req.body.staffId,
    assignedTime: Date.now(),
    reason: req.body.reason,
  };
  const assignedCC = await EDR.findOneAndUpdate(
    { _id: req.body.patientId },
    { $push: { customerCare } },
    {
      new: true,
    }
  );

  // Notification(
  //   'ADT_A02',
  //   'Trasnfer Patient from ED to EOU',
  //   'Customer care',
  //   'Transfer To EOU',
  //   '',
  //   req.body.patientId,
  //   ''
  // );
  res.status(200).json({
    success: true,
    data: assignedCC,
  });
});

exports.getCCStaffByKeyword = asyncHandler(async (req, res, next) => {
  const arr = [];
  const staff = await Staff.find({
    staffType: 'Customer Care',
    disabled: false,
  });

  for (let i = 0; i < staff.length; i++) {
    const fullName = staff[i].name[0].given[0] + ' ' + staff[i].name[0].family;
    if (
      (staff[i].name[0].given[0] &&
        staff[i].name[0].given[0]
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (staff[i].name[0].family &&
        staff[i].name[0].family
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (staff[i].identifier[0].value &&
        staff[i].identifier[0].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      fullName.toLowerCase().startsWith(req.params.keyword.toLowerCase()) ||
      (staff[i].telecom[1].value &&
        staff[i].telecom[1].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (staff[i].nationalID &&
        staff[i].nationalID
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase()))
    ) {
      arr.push(staff[i]);
    }
  }
  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.pendingEdToEouTransfers = asyncHandler(async (req, res, next) => {
  const transfers = await Transfer.find({
    to: 'EOU',
    from: 'ED',
    $or: [{ status: 'pending' }, { status: 'in_progress' }],
    requestedTo: req.params.ccId,
  })
    .select('edrId status')
    .populate([
      {
        path: 'edrId',
        model: 'EDR',
        select: 'patientId room chiefComplaint',
        populate: [
          {
            path: 'patientId',
            model: 'patientfhir',
            select: 'identifier ',
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
        ],
      },
    ]);
  res.status(200).json({
    success: true,
    data: transfers,
  });
});

exports.pendingEouToEdTransfers = asyncHandler(async (req, res, next) => {
  const transfers = await Transfer.find({
    to: 'ED',
    from: 'EOU',
    $or: [{ status: 'pending' }, { status: 'in_progress' }],
    requestedTo: req.params.ccId,
  })
    .select('edrId status')
    .populate([
      {
        path: 'edrId',
        model: 'EDR',
        select: 'patientId room chiefComplaint',
        populate: [
          {
            path: 'patientId',
            model: 'patientfhir',
            select: 'identifier ',
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
        ],
      },
    ]);
  res.status(200).json({
    success: true,
    data: transfers,
  });
});

exports.completeEOUTransfer = asyncHandler(async (req, res, next) => {
  let completedTransfer;
  if (req.body.status === 'in_progress') {
    completedTransfer = await Transfer.findOneAndUpdate(
      { _id: req.params.transferId },
      { $set: { status: req.body.status, inProgressTime: Date.now() } },
      { new: true }
    );
  }
  if (req.body.status === 'completed') {
    completedTransfer = await Transfer.findOneAndUpdate(
      { _id: req.params.transferId },
      { $set: { status: req.body.status, completedAt: Date.now() } },
      { new: true }
    );
  }

  completedTransfer = await Transfer.findById(req.params.transferId).populate([
    {
      path: 'edrId',
      model: 'EDR',
      select: 'patientId',
      populate: [
        {
          path: 'patientId',
          model: 'patientfhir',
          select: 'identifier ',
        },
      ],
    },
  ]);

  const updatedEDR = await EDR.findOneAndUpdate(
    { _id: completedTransfer.edrId._id },
    { $set: { currentLocation: 'EOU' } },
    { new: true }
  ).populate('room.roomId');

  const roomId = updatedEDR.room[updatedEDR.room.length - 1].roomId._id;

  await Room.findOneAndUpdate(
    { _id: roomId },
    { $set: { availability: true } },
    { new: true }
  );

  Notification(
    'ADT_A02',
    'Patient has been transferred to EOU',
    'Sensei',
    'Transfer To EOU',
    '',
    completedTransfer.edrId._id,
    ''
  );

  res.status(200).json({
    success: true,
    data: completedTransfer,
  });
});

exports.completeEDTransfer = asyncHandler(async (req, res, next) => {
  let completedTransfer;
  if (req.body.status === 'in_progress') {
    completedTransfer = await Transfer.findOneAndUpdate(
      { _id: req.params.transferId },
      { $set: { status: req.body.status, inProgressTime: Date.now() } },
      { new: true }
    )
      .select('edrId status')
      .populate([
        {
          path: 'edrId',
          model: 'EDR',
          select: 'patientId',
          populate: [
            {
              path: 'patientId',
              model: 'patientfhir',
              select: 'identifier ',
            },
          ],
        },
      ]);
  } else {
    completedTransfer = await Transfer.findOneAndUpdate(
      { _id: req.params.transferId },
      { $set: { status: req.body.status, completedAt: Date.now() } },
      { new: true }
    )
      .select('edrId status')
      .populate([
        {
          path: 'edrId',
          model: 'EDR',
          select: 'patientId',
          populate: [
            {
              path: 'patientId',
              model: 'patientfhir',
              select: 'identifier ',
            },
          ],
        },
      ]);
  }

  const updatedEDR = await EDR.findOneAndUpdate(
    { _id: completedTransfer.edrId._id },
    { $set: { currentLocation: 'ED' } },
    { new: true }
  ).populate('room.roomId');

  res.status(200).json({
    success: true,
    data: completedTransfer,
  });
});

exports.completedEdToEouTransfers = asyncHandler(async (req, res, next) => {
  const transfers = await Transfer.find({
    to: 'EOU',
    from: 'ED',
    status: 'completed',
    requestedTo: req.params.ccId,
  })
    .select('edrId status')
    .populate([
      {
        path: 'edrId',
        model: 'EDR',
        select: 'patientId room chiefComplaint',
        populate: [
          {
            path: 'patientId',
            model: 'patientfhir',
            select: 'identifier ',
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
        ],
      },
    ]);
  res.status(200).json({
    success: true,
    data: transfers,
  });
});

exports.completedEouToEdTransfers = asyncHandler(async (req, res, next) => {
  const transfers = await Transfer.find({
    to: 'ED',
    from: 'EOU',
    status: 'completed',
    requestedTo: req.params.ccId,
  })
    .select('edrId status')
    .populate([
      {
        path: 'edrId',
        model: 'EDR',
        select: 'patientId room chiefComplaint',
        populate: [
          {
            path: 'patientId',
            model: 'patientfhir',
            select: 'identifier ',
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
        ],
      },
    ]);
  res.status(200).json({
    success: true,
    data: transfers,
  });
});

exports.pendingDischargeEdrs = asyncHandler(async (req, res, next) => {
  const discharge = await CCRequest.find({
    requestedFor: 'Discharge',
    status: 'pending',
    costomerCareId: req.params.ccId,
  })
    // .select('edrId status ')
    .populate([
      {
        path: 'edrId',
        model: 'EDR',
        select: 'patientId room chiefComplaint.chiefComplaintId',
        populate: [
          {
            path: 'patientId',
            model: 'patientfhir',
            select: 'identifier ',
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
        ],
      },
      {
        path: 'staffId',
        model: 'staff',
        select: 'name',
      },
    ]);
  res.status(200).json({
    success: true,
    data: discharge,
  });
});

exports.completeDischarge = asyncHandler(async (req, res, next) => {
  const completedDischarge = await CCRequest.findOneAndUpdate(
    { _id: req.params.dischargeId },
    { $set: { status: 'completed', completedAt: Date.now() } },
    { new: true }
  )
    .select('edrId status requestNo')
    .populate([
      {
        path: 'edrId',
        model: 'EDR',
        select: 'patientId ',
        populate: [
          {
            path: 'patientId',
            model: 'patientfhir',
            select: 'identifier ',
          },
        ],
      },
    ]);

  res.status(200).json({
    success: true,
    data: completedDischarge,
  });
});

exports.completedDischargeEdrs = asyncHandler(async (req, res, next) => {
  const discharge = await CCRequest.find({
    requestedFor: 'Discharge',
    status: 'completed',
    costomerCareId: req.params.ccId,
  })
    // .select('edrId status ')
    .populate([
      {
        path: 'edrId',
        model: 'EDR',
        select: 'patientId room chiefComplaint.chiefComplaintId',
        populate: [
          {
            path: 'patientId',
            model: 'patientfhir',
            select: 'identifier ',
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
        ],
      },
      {
        path: 'staffId',
        model: 'staff',
        select: 'name',
      },
    ]);
  res.status(200).json({
    success: true,
    data: discharge,
  });
});

exports.getPendingSurveyEdrs = asyncHandler(async (req, res, next) => {
  const edrs = await EDR.find({
    status: 'pending',
    survey: { $eq: [] },
  })
    .populate([
      {
        path: 'patientId',
        model: 'patientfhir',
        select: 'identifier name ',
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
    ])
    .select('patientId room chiefComplaint');

  res.status(200).json({
    success: true,
    data: edrs,
  });
});

exports.getCompletedSurveyEdrs = asyncHandler(async (req, res, next) => {
  const edrs = await EDR.find({ status: 'pending', survey: { $ne: [] } })
    .populate([
      {
        path: 'patientId',
        model: 'patientfhir',
        select: 'identifier name ',
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
    ])
    .select('patientId room chiefComplaint survey');

  res.status(200).json({
    success: true,
    data: edrs,
  });
});

exports.pendingMedications = asyncHandler(async (req, res, next) => {
  const unwindEdr = await EDR.aggregate([
    {
      $project: {
        _id: 1,
        pharmacyRequest: 1,
        patientId: 1,
        chiefComplaint: 1,
        room: 1,
        doctorNotes: 1,
      },
    },
    {
      $unwind: '$pharmacyRequest',
    },
    {
      $match: {
        $and: [
          { 'pharmacyRequest.status': 'in_progress' },
          {
            'pharmacyRequest.customerCareId': mongoose.Types.ObjectId(
              req.params.ccId
            ),
          },
        ],
      },
    },
    // {
    //   $group: {
    //     _id: { patientId: '$patientId' },
    //     labRequest: { $push: '$labRequest' },
    //   },
    // },
    // {
    //   $project: {
    //     patientId: '$_id',
    //     _id: 0,
    //     labRequest: 1,
    //   },
    // },
  ]);

  const medications = await EDR.populate(unwindEdr, [
    {
      path: 'patientId',
      model: 'patientfhir',
      select: 'identifier name gender age weight',
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
  ]);

  res.status(200).json({
    success: true,
    data: medications,
  });
});

exports.updateMedicationStatus = asyncHandler(async (req, res, next) => {
  const edrMedication = await EDR.findOne({ _id: req.body.edrId });

  let request;
  for (let i = 0; i < edrMedication.pharmacyRequest.length; i++) {
    if (edrMedication.pharmacyRequest[i]._id == req.body.requestId) {
      request = i;
    }
  }

  const updatedRequest = await EDR.findOneAndUpdate(
    { _id: req.body.edrId },
    {
      $set: {
        [`pharmacyRequest.${request}.status`]: 'delivery_in_progress',
        [`pharmacyRequest.${request}.deliveryInProgressTime`]: Date.now(),
      },
    },
    { new: true }
  )
    .select('patientId pharmacyRequest')
    .populate('patientId', 'Identifier');

  res.status(200).json({
    success: true,
    data: updatedRequest,
  });
});

exports.completedMedications = asyncHandler(async (req, res, next) => {
  const unwindEdr = await EDR.aggregate([
    {
      $project: {
        _id: 1,
        pharmacyRequest: 1,
        patientId: 1,
        chiefComplaint: 1,
        room: 1,
        doctorNotes: 1,
      },
    },
    {
      $unwind: '$pharmacyRequest',
    },
    {
      $match: {
        $and: [
          { 'pharmacyRequest.status': 'delivery_in_progress' },
          {
            'pharmacyRequest.customerCareId': mongoose.Types.ObjectId(
              req.params.ccId
            ),
          },
        ],
      },
    },
    // {
    //   $group: {
    //     _id: { patientId: '$patientId' },
    //     labRequest: { $push: '$labRequest' },
    //   },
    // },
    // {
    //   $project: {
    //     patientId: '$_id',
    //     _id: 0,
    //     labRequest: 1,
    //   },
    // },
  ]);

  const medications = await EDR.populate(unwindEdr, [
    {
      path: 'patientId',
      model: 'patientfhir',
      select: 'identifier name gender age weight',
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
  ]);

  res.status(200).json({
    success: true,
    data: medications,
  });
});

exports.pendingAmbulanceRequest = asyncHandler(async (req, res, next) => {
  const requests = await CCRequest.find({
    requestedFor: 'Transfer',
    status: 'pending',
    costomerCareId: req.params.ccId,
  })
    // .select('edrId status ')
    .populate([
      {
        path: 'edrId',
        model: 'EDR',
        select: 'patientId room chiefComplaint.chiefComplaintId',
        populate: [
          {
            path: 'patientId',
            model: 'patientfhir',
            select: 'identifier ',
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
        ],
      },
      {
        path: 'staffId',
        model: 'staff',
        select: 'name',
      },
    ]);
  res.status(200).json({
    success: true,
    data: requests,
  });
});

exports.updateAmbulanceRequest = asyncHandler(async (req, res, next) => {
  await EDR.findOneAndUpdate(
    { _id: req.body.edrId },
    { $set: { patientInHospital: true } },
    { new: true }
  );
  const completedRequest = await CCRequest.findOneAndUpdate(
    { _id: req.body.requestId },
    { $set: { status: 'completed', completedAt: Date.now() } },
    { new: true }
  )
    .select('edrId status requestNo')
    .populate([
      {
        path: 'edrId',
        model: 'EDR',
        select: 'patientId ',
        populate: [
          {
            path: 'patientId',
            model: 'patientfhir',
            select: 'identifier ',
          },
        ],
      },
    ]);

  Notification(
    'ADT_A01',
    'New Patient Arrived',
    'Doctor',
    'Paramedics',
    '/dashboard/home/patientmanagement/careStreamPatients',
    req.body.edrId,
    '',
    'ED Doctor'
  );

  res.status(200).json({
    success: true,
    data: completedRequest,
  });
});

exports.completedAmbulanceRequest = asyncHandler(async (req, res, next) => {
  const requests = await CCRequest.find({
    requestedFor: 'Transfer',
    status: 'completed',
    costomerCareId: req.params.ccId,
  })
    // .select('edrId status ')
    .populate([
      {
        path: 'edrId',
        model: 'EDR',
        select: 'patientId room chiefComplaint.chiefComplaintId',
        populate: [
          {
            path: 'patientId',
            model: 'patientfhir',
            select: 'identifier ',
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
        ],
      },
      {
        path: 'staffId',
        model: 'staff',
        select: 'name',
      },
    ]);
  res.status(200).json({
    success: true,
    data: requests,
  });
});
exports.workDoneByCC = asyncHandler(async (req, res, next) => {
  const request = await CCRequest.find({ status: 'completed' }).populate([
    {
      path: 'edrId',
      model: 'EDR',
      select: 'patientId room chiefComplaint.chiefComplaintId',
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
      ],
    },
    {
      path: 'costomerCareId',
      model: 'staff',
      select: 'identifier name',
    },
  ]);

  const transfers = await Transfer.find({ status: 'completed' }).populate([
    {
      path: 'edrId',
      model: 'EDR',
      select: 'patientId room chiefComplaint.chiefComplaintId',
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
      ],
    },
    {
      path: 'requestedTo',
      model: 'staff',
      select: 'identifier name',
    },
  ]);

  // const assistance = await Assistance.find({staffType:'Customer Care'})
  const workDone = [...request, ...transfers];
  res.status(200).json({
    success: true,
    data: workDone,
  });
});

exports.searchWorkDoneByCC = asyncHandler(async (req, res, next) => {
  const request = await CCRequest.find({ status: 'completed' }).populate([
    {
      path: 'edrId',
      model: 'EDR',
      select: 'patientId room chiefComplaint.chiefComplaintId',
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
      ],
    },
    {
      path: 'costomerCareId',
      model: 'staff',
      select: 'identifier name',
    },
  ]);

  const transfers = await Transfer.find({ status: 'completed' }).populate([
    {
      path: 'edrId',
      model: 'EDR',
      select: 'patientId room chiefComplaint.chiefComplaintId',
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
      ],
    },
    {
      path: 'requestedTo',
      model: 'staff',
      select: 'identifier name',
    },
  ]);

  // console.log(transfers[0].requestedTo);
  const newTransfers = transfers.map(
    ({ requestedTo: costomerCareId, edrId }) => ({
      costomerCareId,
      edrId,
    })
  );
  // console.log(newTransfers);

  // const assistance = await Assistance.find({staffType:'Customer Care'})
  const staff = [...request, ...newTransfers];
  // console.log(staff[0].costomerCareId.name[0].given[0]);
  const arr = [];
  for (let i = 0; i < staff.length; i++) {
    const fullName =
      staff[i].edrId.patientId.name[0].given[0] +
      ' ' +
      staff[i].edrId.patientId.name[0].family;
    const ccFullName =
      staff[i].costomerCareId.name[0].given[0] +
      ' ' +
      staff[i].costomerCareId.name[0].family;
    if (
      (staff[i].edrId.patientId.name[0].given[0] &&
        staff[i].edrId.patientId.name[0].given[0]
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (staff[i].edrId.patientId.name[0].family &&
        staff[i].edrId.patientId.name[0].family
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (staff[i].edrId.patientId.identifier[0].value &&
        staff[i].edrId.patientId.identifier[0].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      fullName.toLowerCase().startsWith(req.params.keyword.toLowerCase()) ||
      (staff[i].costomerCareId.name[0].given[0] &&
        staff[i].costomerCareId.name[0].given[0]
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (staff[i].costomerCareId.name[0].family &&
        staff[i].costomerCareId.name[0].family
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (staff[i].costomerCareId.identifier[0].value &&
        staff[i].costomerCareId.identifier[0].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      ccFullName.toLowerCase().startsWith(req.params.keyword.toLowerCase())
    ) {
      arr.push(staff[i]);
    }
  }
  res.status(200).json({
    success: true,
    data: arr,
  });
});
