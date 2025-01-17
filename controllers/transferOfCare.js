const Staff = require('../models/staffFhir/staff');
const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
const Shift = require('../models/shift');
const TOC = require('../models/TransferOfCare');
const Notification = require('../components/notification');

exports.getCurrentShiftDocs = asyncHandler(async (req, res, next) => {
  const doctorPA = await Staff.findById(req.params.staffId)
    .select('chiefComplaint.chiefComplaintId shift')
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

  const staff = await Staff.find({
    _id: { $ne: req.params.staffId },
    staffType: 'Doctor',
    subType: 'ED Doctor',
    shift: doctorPA.shift,
    'chiefComplaint.chiefComplaintId': chiefComplaintId,
  });

  res.status(200).json({
    success: true,
    data: staff,
  });
});

exports.getNextShiftDocs = asyncHandler(async (req, res, next) => {
  const doctorPA = await Staff.findById(req.params.staffId)
    .select('chiefComplaint.chiefComplaintId shift')
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

  // Finding Next Shift Staff
  let staff;
  const currentShift = await Shift.findById(doctorPA.shift);
  //   console.log(currentShift);
  if (currentShift.name === 'Morning') {
    const nextShift = await Shift.findOne({ name: 'Evening' });
    staff = await Staff.find({
      _id: { $ne: req.params.staffId },
      staffType: 'Doctor',
      subType: 'ED Doctor',
      shift: nextShift._id,
      'chiefComplaint.chiefComplaintId': chiefComplaintId,
    });
  }

  if (currentShift.name === 'Evening') {
    const nextShift = await Shift.findOne({ name: 'Night' });
    staff = await Staff.find({
      _id: { $ne: req.params.staffId },
      staffType: 'Doctor',
      subType: 'ED Doctor',
      shift: nextShift._id,
      'chiefComplaint.chiefComplaintId': chiefComplaintId,
    });
  }

  if (currentShift.name === 'Night') {
    const nextShift = await Shift.findOne({ name: 'Morning' });

    staff = await Staff.find({
      _id: { $ne: req.params.staffId },
      staffType: 'Doctor',
      subType: 'ED Doctor',
      shift: nextShift._id,
      'chiefComplaint.chiefComplaintId': chiefComplaintId,
    });
  }

  res.status(200).json({
    success: true,
    data: staff,
  });
});

exports.submitTransfer = asyncHandler(async (req, res, next) => {
  const { edrId, transferredBy, transferredTo } = req.body;
  const newTOC = await TOC.create({
    edrId,
    transferredBy,
    transferredTo,
    transferredAt: Date.now(),
  });

  const doctorPA = await Staff.findById(transferredTo)
    .select('chiefComplaint.chiefComplaintId shift')
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

  const EDNurses = await Staff.find({
    _id: { $ne: req.params.staffId },
    staffType: 'Nurses',
    subType: 'ED Nurse',
    shift: doctorPA.shift,
    'chiefComplaint.chiefComplaintId': chiefComplaintId,
  });

  EDNurses.forEach((nurse) => {
    Notification(
      'Transfer Of Care',
      'Transfer Of Care',
      '',
      'Transfer Of Care',
      '/dashboard/home/notes',
      edrId,
      '',
      '',
      nurse._id
    );
  });

  Notification(
    'Transfer Of Care',
    'Transfer Of Care',
    '',
    'Transfer Of Care',
    '/dashboard/home/patientlist',
    edrId,
    '',
    '',
    transferredTo
  );

  Notification(
    'Transfer Of Care',
    'Transfer Of Care',
    'Sensei',
    'Transfer Of Care',
    '/dashboard/home/patientlog/ED',
    edrId,
    '',
    '',
    ''
  );

  Notification(
    'Transfer Of Care',
    'Transfer Of Care',
    'Admin',
    'Transfer Of Care',
    '/dashboard/home/patientlog/ED',
    edrId,
    '',
    '',
    ''
  );

  //   await EDR.findOneAndUpdate(
  //     { _id: req.body.edrId },
  //     {
  //       $set: {
  //         'doctorNotes.$[].currentOwner': transferredTo,
  //         'edNurseRequest.$[].currentOwner': transferredTo,
  //         'eouNurseRequest.$[].currentOwner': transferredTo,
  //         'nurseTechnicianRequest.$[].currentOwner': transferredTo,
  //         'consultationNote.$[].currentOwner': transferredTo,
  //         'anesthesiologistNote.$[].currentOwner': transferredTo,
  //         'pharmacyRequest.$[].currentOwner': transferredTo,
  //         'labRequest.$[].currentOwner': transferredTo,
  //         'radRequest.$[].currentOwner': transferredTo,
  //       },
  //     },
  //     {
  //       new: true,
  //     }
  //   );

  res.status(200).json({
    success: true,
    data: newTOC,
  });
});

// Next Shift EOU Nurses
exports.getCurrentShiftNurses = asyncHandler(async (req, res, next) => {
  const nursePA = await Staff.findById(req.params.staffId).select(
    'chiefComplaint shift'
  );

  const latestCC = nursePA.chiefComplaint.length - 1;

  const chiefComplaintId =
    nursePA.chiefComplaint[latestCC].chiefComplaintId._id;

  const staff = await Staff.find({
    _id: { $ne: req.params.staffId },
    staffType: 'Nurses',
    subType: 'EOU Nurse',
    // shift: nursePA.shift,
    'chiefComplaint.-1.chiefComplaintId': chiefComplaintId,
  });

  res.status(200).json({
    success: true,
    data: staff,
  });
});
