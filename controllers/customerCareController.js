const Staff = require('../models/staffFhir/staff');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const EDR = require('../models/EDR/EDR');
const Transfer = require('../models/patientTransferEDEOU/patientTransferEDEOU');
const CCRequest = require('../models/customerCareRequest');

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
    status: 'pending',
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

exports.completeTransfer = asyncHandler(async (req, res, next) => {
  const completedTransfer = await Transfer.findOneAndUpdate(
    { _id: req.params.transferId },
    { $set: { status: 'completed', completedAt: Date.now() } },
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
