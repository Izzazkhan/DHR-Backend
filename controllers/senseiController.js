const Staff = require('../models/staffFhir/staff');
const asyncHandler = require('../middleware/async');
const EDR = require('../models/EDR/EDR');
const PA = require('../models/productionArea');
const CC = require('../models/chiefComplaint/chiefComplaint');
const ErrorResponse = require('../utils/errorResponse');
const EouTransfer = require('../models/patientTransferEDEOU/patientTransferEDEOU');
const Room = require('../models/room');
const { populate } = require('../models/staffFhir/staff');

exports.updateStaffShift = asyncHandler(async (req, res, next) => {
  const staff = await Staff.findOne({ _id: req.body.staffId });
  if (staff.availability === false) {
    res
      .status(200)
      .json({ success: false, data: 'Staff already assigned to Visit' });
  } else if (staff.disabled === true) {
    res.status(200).json({ success: false, data: 'Staff disabled' });
  } else {
    // console.log(req.body);
    const chiefComplaint = {
      assignedBy: req.body.assignedBy,
      chiefComplaintId: req.body.chiefComplaint,
      assignedTime: Date.now(),
    };

    const updatedStaff = await Staff.findOneAndUpdate(
      { _id: staff.id },
      { $push: { chiefComplaint } },
      {
        new: true,
      }
    );
    const productionArea = {
      assignedBy: req.body.assignedBy,
      productionAreaId: req.body.productionAreaName,
      assignedTime: Date.now(),
    };
    await Staff.findOneAndUpdate(
      { _id: staff.id },
      { $push: { productionArea } },
      {
        new: true,
      }
    );
    await Staff.findOneAndUpdate(
      { _id: staff.id },
      {
        $set: {
          shift: req.body.shift,
          shiftStartTime: req.body.shiftStartTime,
          shiftEndTime: req.body.shiftEndTime,
        },
      },
      {
        new: true,
      }
    );
    const updateRecord = {
      updatetAt: Date.now(),
      updatedBy: req.body.assignedBy,
      reason: req.body.reason,
    };

    await Staff.findOneAndUpdate(
      { _id: staff.id },
      {
        $push: { updateRecord },
      },
      {
        new: true,
      }
    );

    res.status(200).json({
      success: true,
      data: updatedStaff,
    });
  }
});

exports.getCCPatients = asyncHandler(async (req, res, next) => {
  const patients = await EDR.find({
    status: 'Discharged',
    chiefComplaint: { $ne: [] },
    patientInHospital: true,
  }).populate([
    {
      path: 'chiefComplaint.chiefComplaintId',
      model: 'chiefComplaint',
      populate: [
        {
          path: 'productionArea.productionAreaId',
          model: 'productionArea',
          populate: [
            {
              path: 'rooms.roomId',
              model: 'room',
            },
          ],
        },
      ],
    },
    {
      path: 'patientId',
      model: 'patientfhir',
    },
  ]);

  const newArray = [];
  for (let i = 0; i < patients.length; i++) {
    let count = 1;

    const obj = JSON.parse(JSON.stringify(patients[i]));
    const x =
      patients[i].chiefComplaint[patients[i].chiefComplaint.length - 1]
        .chiefComplaintId._id;
    for (let j = 0; j < patients.length; j++) {
      const y =
        patients[j].chiefComplaint[patients[j].chiefComplaint.length - 1]
          .chiefComplaintId._id;
      if (x === y && patients[i]._id !== patients[j]._id) {
        count++;
      }
    }

    obj.count = count;
    newArray.push(obj);
    // console.log('count', patients[i]);
  }

  res.status(200).json({
    success: true,
    data: newArray,
  });
});

exports.searchCCPatients = asyncHandler(async (req, res, next) => {
  const patients = await EDR.find({
    status: 'pending',
    chiefComplaint: { $ne: [] },
  }).populate([
    {
      path: 'chiefComplaint.chiefComplaintId',
      model: 'chiefComplaint',
      populate: [
        {
          path: 'productionArea.productionAreaId',
          model: 'productionArea',
          populate: [
            {
              path: 'rooms.roomId',
              model: 'room',
            },
          ],
        },
      ],
    },
    {
      path: 'patientId',
      model: 'patientfhir',
    },
  ]);

  const arr = [];
  for (let i = 0; i < patients.length; i++) {
    const fullName =
      patients[i].patientId.name[0].given[0] +
      ' ' +
      patients[i].patientId.name[0].family;
    if (
      (patients[i].patientId.name[0].given[0] &&
        patients[i].patientId.name[0].given[0]
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].patientId.name[0].family &&
        patients[i].patientId.name[0].family
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].patientId.identifier[0].value &&
        patients[i].patientId.identifier[0].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      fullName.toLowerCase().startsWith(req.params.keyword.toLowerCase()) ||
      (patients[i].patientId.telecom[1].value &&
        patients[i].patientId.telecom[1].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].patientId.nationalID &&
        patients[i].patientId.nationalID
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase()))
    ) {
      arr.push(patients[i]);
    }
  }
  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.getPatientsByPA = asyncHandler(async (req, res, next) => {
  const patients = await PA.findOne({
    _id: req.params.productionAreaId,
  }).populate('rooms.roomId');

  // console.log(patients.rooms[1].roomId.availability);
  const arr = [];
  for (let i = 0; i < patients.rooms.length; i++) {
    if (patients.rooms[i].roomId.availability === false) {
      arr.push(patients.rooms[i].roomId._id);
    }
  }
  console.log(arr);
  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.getPatientByRoom = asyncHandler(async (req, res, next) => {
  // console.log(req.params);
  const rooms = await EDR.findOne({
    'room.roomId': req.params.roomId,
    room: { $ne: [] },
  }).select('room');
  // console.log(rooms.room.length);
  const latestRoom = rooms.room.length - 1;
  // console.log(latestRoom);
  const patient = await EDR.findOne({
    [`room.${latestRoom}.roomId`]: req.params.roomId,
  })
    .populate('patientId', 'identifier name')
    .select('patientId');
  // console.log(patient);
  res.status(200).json({
    success: true,
    data: patient,
  });
});

exports.patientsByCC = asyncHandler(async (req, res, next) => {
  const chiefComplaint = await CC.find({ productionArea: { $ne: [] } }).select(
    'name chiefComplaintId'
  );
  const edrCC = await EDR.find({
    chiefComplaint: { $ne: [] },
    status: 'pending',
  }).select('chiefComplaint.chiefComplaintId');
  let count = 0;
  const newArray = [];

  for (let i = 0; i < chiefComplaint.length; i++) {
    const obj = JSON.parse(JSON.stringify(chiefComplaint[i]));
    count = 0;
    for (let j = 0; j < edrCC.length; j++) {
      const latestCC =
        edrCC[j].chiefComplaint[edrCC[j].chiefComplaint.length - 1];
      // console.log(latestCC);
      if (
        chiefComplaint[i]._id.toString() ===
        latestCC.chiefComplaintId.toString()
      ) {
        count++;
      }
    }
    obj.count = count;
    newArray.push(obj);
  }
  // console.log(newArray);

  res.status(200).json({
    success: true,
    data: newArray,
  });
});

exports.getCR = asyncHandler(async (req, res, next) => {
  const cr = await EDR.find({
    consultationNote: { $ne: [] },
  }).populate([
    {
      path: 'patientId',
      model: 'patientfhir',
    },
    {
      path: 'consultationNote.addedBy',
      model: 'staff',
    },
    {
      path: 'consultationNote.consultant',
      model: 'staff',
    },
    {
      path: 'radRequest.serviceId',
      model: 'RadiologyService',
    },
    {
      path: 'radRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'labRequest.serviceId',
      model: 'LaboratoryService',
    },
    {
      path: 'labRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.item.itemId',
      model: 'Item',
    },
    {
      path: 'doctorNotes.addedBy',
      model: 'staff',
    },
    {
      path: 'edNurseRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'eouNurseRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'nurseTechnicianRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'anesthesiologistNote.addedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.reconciliationNotes.addedBy',
      model: 'staff',
    },
  ]);
  res.status(200).json({
    success: true,
    data: cr,
  });
});

exports.getEDPatients = asyncHandler(async (req, res, next) => {
  const ed = await EDR.find({
    currentLocation: 'ED',
  }).populate([
    {
      path: 'patientId',
      model: 'patientfhir',
    },
    {
      path: 'consultationNote.addedBy',
      model: 'staff',
    },
    {
      path: 'consultationNote.consultant',
      model: 'staff',
    },
    {
      path: 'radRequest.serviceId',
      model: 'RadiologyService',
    },
    {
      path: 'radRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'labRequest.serviceId',
      model: 'LaboratoryService',
    },
    {
      path: 'labRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.item.itemId',
      model: 'Item',
    },
    {
      path: 'doctorNotes.addedBy',
      model: 'staff',
    },
    {
      path: 'edNurseRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'eouNurseRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'nurseTechnicianRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'anesthesiologistNote.addedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.reconciliationNotes.addedBy',
      model: 'staff',
    },
  ]);
  res.status(200).json({
    success: true,
    data: ed,
  });
});

exports.getEOUPatients = asyncHandler(async (req, res, next) => {
  const eou = await EDR.find({
    currentLocation: 'EOU',
  }).populate([
    {
      path: 'patientId',
      model: 'patientfhir',
    },
    {
      path: 'consultationNote.addedBy',
      model: 'staff',
    },
    {
      path: 'consultationNote.consultant',
      model: 'staff',
    },
    {
      path: 'radRequest.serviceId',
      model: 'RadiologyService',
    },
    {
      path: 'radRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'labRequest.serviceId',
      model: 'LaboratoryService',
    },
    {
      path: 'labRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.item.itemId',
      model: 'Item',
    },
    {
      path: 'doctorNotes.addedBy',
      model: 'staff',
    },
    {
      path: 'edNurseRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'eouNurseRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'nurseTechnicianRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'anesthesiologistNote.addedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.reconciliationNotes.addedBy',
      model: 'staff',
    },
  ]);
  res.status(200).json({
    success: true,
    data: eou,
  });
});

exports.searchEDPatients = asyncHandler(async (req, res, next) => {
  const patients = await EDR.find({
    currentLocation: 'ED',
  }).populate([
    {
      path: 'patientId',
      model: 'patientfhir',
    },
    {
      path: 'consultationNote.addedBy',
      model: 'staff',
    },
    {
      path: 'consultationNote.consultant',
      model: 'staff',
    },
    {
      path: 'radRequest.serviceId',
      model: 'RadiologyService',
    },
    {
      path: 'radRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'labRequest.serviceId',
      model: 'LaboratoryService',
    },
    {
      path: 'labRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.item.itemId',
      model: 'Item',
    },
    {
      path: 'doctorNotes.addedBy',
      model: 'staff',
    },
    {
      path: 'edNurseRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'eouNurseRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'nurseTechnicianRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'anesthesiologistNote.addedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.reconciliationNotes.addedBy',
      model: 'staff',
    },
  ]);
  const arr = [];
  for (let i = 0; i < patients.length; i++) {
    const fullName =
      patients[i].patientId.name[0].given[0] +
      ' ' +
      patients[i].patientId.name[0].family;
    if (
      (patients[i].patientId.name[0].given[0] &&
        patients[i].patientId.name[0].given[0]
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].patientId.name[0].family &&
        patients[i].patientId.name[0].family
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].patientId.identifier[0].value &&
        patients[i].patientId.identifier[0].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      fullName.toLowerCase().startsWith(req.params.keyword.toLowerCase()) ||
      (patients[i].patientId.telecom[1].value &&
        patients[i].patientId.telecom[1].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].patientId.nationalID &&
        patients[i].patientId.nationalID
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase()))
    ) {
      arr.push(patients[i]);
    }
  }
  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.searchEOUPatients = asyncHandler(async (req, res, next) => {
  const patients = await EDR.find({
    currentLocation: 'EOU',
  }).populate([
    {
      path: 'patientId',
      model: 'patientfhir',
    },
    {
      path: 'consultationNote.addedBy',
      model: 'staff',
    },
    {
      path: 'consultationNote.consultant',
      model: 'staff',
    },
    {
      path: 'radRequest.serviceId',
      model: 'RadiologyService',
    },
    {
      path: 'radRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'labRequest.serviceId',
      model: 'LaboratoryService',
    },
    {
      path: 'labRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.item.itemId',
      model: 'Item',
    },
    {
      path: 'doctorNotes.addedBy',
      model: 'staff',
    },
    {
      path: 'edNurseRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'eouNurseRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'nurseTechnicianRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'anesthesiologistNote.addedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.reconciliationNotes.addedBy',
      model: 'staff',
    },
  ]);
  const arr = [];
  for (let i = 0; i < patients.length; i++) {
    const fullName =
      patients[i].patientId.name[0].given[0] +
      ' ' +
      patients[i].patientId.name[0].family;
    if (
      (patients[i].patientId.name[0].given[0] &&
        patients[i].patientId.name[0].given[0]
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].patientId.name[0].family &&
        patients[i].patientId.name[0].family
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].patientId.identifier[0].value &&
        patients[i].patientId.identifier[0].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      fullName.toLowerCase().startsWith(req.params.keyword.toLowerCase()) ||
      (patients[i].patientId.telecom[1].value &&
        patients[i].patientId.telecom[1].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].patientId.nationalID &&
        patients[i].patientId.nationalID
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase()))
    ) {
      arr.push(patients[i]);
    }
  }
  res.status(200).json({
    success: true,
    data: arr,
  });
});

// Stats for ED Room History

exports.timeInterval = asyncHandler(async (req, res, next) => {
  const patientsTime = await EDR.aggregate([
    {
      $match: {
        $and: [{ status: 'Discharged' }, { currentLocation: 'ED' }],
      },
    },
    {
      $project: {
        patientId: 1,
        createdTimeStamp: 1,
        dischargeTimestamp: 1,
        dateDifference: {
          $divide: [
            {
              $subtract: ['$dischargeTimestamp', '$createdTimeStamp'],
            },
            1000 * 60 * 60 * 24,
          ],
        },
      },
    },
  ]);

  patientsTime.map(
    (day) => (day.days = day.dateDifference.toString().split('.')[0])
  );

  patientsTime.map((patient) => {
    const h = patient.dateDifference;
    const int = Math.trunc(h);
    const float = Number((h - int).toFixed(8));
    patient.hours = Math.trunc(float * 24);
  });

  const patients = await EDR.populate(patientsTime, [
    {
      path: 'patientId',
      model: 'patientfhir',
      select: 'identifier name gender age weight',
    },
  ]);

  res.status(200).json({
    success: true,
    data: patients,
  });
});

exports.transferToEOU = asyncHandler(async (req, res, next) => {
  const transfers = await EouTransfer.find({
    to: 'EOU',
    status: 'completed',
  })
    .select('edrId')
    .populate([
      {
        path: 'edrId',
        model: 'EDR',
        select: 'patientId room chiefComplaint',
        populate: [
          {
            path: 'patientId',
            model: 'patientfhir',
            select: 'identifier name ',
          },
          {
            path: 'room.roomId',
            model: 'room',
            select: 'roomNo roomId',
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

exports.getDischarged = asyncHandler(async (req, res, next) => {
  const discharged = await EDR.find({
    status: 'Discharged',
    currentLocation: 'ED',
  })
    .select('status patientId room careStream.name dischargeTimestamp')
    .populate([
      {
        path: 'patientId',
        model: 'patientfhir',
        select: 'identifier name',
      },
      {
        path: 'room.roomId',
        model: 'room',
        select: 'roomNo roomId',
      },
    ]);

  res.status(200).json({
    success: true,
    data: discharged,
  });
});

exports.getLabTest = asyncHandler(async (req, res, next) => {
  const labs = await EDR.find({
    status: 'Discharged',
    labRequest: { $ne: [] },
    currentLocation: 'ED',
  })
    .select('patientId labRequest')
    .populate([
      {
        path: 'patientId',
        model: 'patientfhir',
        select: 'identifier name',
      },
      {
        path: 'room.roomId',
        model: 'room',
        select: 'roomId roomNo',
      },
    ]);

  // labs.map((lab) => (lab.totalTests = lab.labRequest.length));
  // console.log(labs[0].totalTests);
  res.status(200).json({
    success: true,
    data: labs,
  });
});

exports.getDeceased = asyncHandler(async (req, res, next) => {
  const deceased = await EDR.find({
    status: 'Discharged',
    'dischargeRequest.dischargeSummary.edrCompletionReason': 'deceased',
    currentLocation: 'ED',
  })
    .select('status patientId room careStream.name dischargeTimestamp')
    .populate([
      {
        path: 'patientId',
        model: 'patientfhir',
        select: 'identifier name',
      },
      {
        path: 'room.roomId',
        model: 'room',
        select: 'roomId roomNo',
      },
    ]);

  res.status(200).json({
    success: true,
    data: deceased,
  });
});

// Stats For Current ED Room
exports.availableEdBeds = asyncHandler(async (req, res, next) => {
  const beds = await Room.find({ availability: true }).select('roomId roomNo');

  res.status(200).json({
    success: true,
    data: beds,
  });
});

exports.getEDCCPatients = asyncHandler(async (req, res, next) => {
  const patients = await EDR.find({
    status: 'pending',
    currentLocation: 'ED',
    chiefComplaint: { $ne: [] },
    patientInHospital: true,
  })
    .select('patientId chiefComplaint')
    .populate([
      {
        path: 'chiefComplaint.chiefComplaintId',
        model: 'chiefComplaint',
        select: 'chiefComplaintId name',
        // populate: [
        //   {
        //     path: 'productionArea.productionAreaId',
        //     model: 'productionArea',
        //     populate: [
        //       {
        //         path: 'rooms.roomId',
        //         model: 'room',
        //       },
        //     ],
        //   },
        // ],
      },
      // {
      //   path: 'patientId',
      //   model: 'patientfhir',
      // },
    ]);

  const newArray = [];
  for (let i = 0; i < patients.length; i++) {
    let count = 1;

    const obj = JSON.parse(JSON.stringify(patients[i]));
    const x =
      patients[i].chiefComplaint[patients[i].chiefComplaint.length - 1]
        .chiefComplaintId._id;
    for (let j = 0; j < patients.length; j++) {
      const y =
        patients[j].chiefComplaint[patients[j].chiefComplaint.length - 1]
          .chiefComplaintId._id;
      if (x === y && patients[i]._id !== patients[j]._id) {
        count++;
      }
    }

    obj.count = count;
    newArray.push(obj);
    // console.log('count', patients[i]);
  }

  res.status(200).json({
    success: true,
    data: newArray,
  });
});

exports.getPatientTreatment = asyncHandler(async (req, res, next) => {
  const patients = await EDR.find({ status: 'pending', currentLocation: 'ED' })
    .select('patientId chiefComlaint ')
    .populate([
      {
        path: 'chiefComplaint.chiefComplaintId',
        model: 'chiefComplaint',
        select: 'chiefComplaint.chiefComplaintId',
        populate: [
          {
            path: 'productionArea.productionAreaId',
            model: 'productionArea',
            select: 'paName',
          },
        ],
      },
      {
        path: 'patientId',
        model: 'patientfhir',
        select: 'name identifier',
      },
    ]);

  res.status(200).json({
    success: true,
    data: patients,
  });
});

exports.getMedicationReconciliation = asyncHandler(async (req, res, next) => {
  const notes = await EDR.find({
    pharmacyRequest: { $elemMatch: { reconciliationNotes: { $ne: [] } } },
    currentLocation: 'ED',
  })
    .select('patientId chiefComlaint pharmacyRequest careStream.name')
    .populate([
      {
        path: 'chiefComplaint.chiefComplaintId',
        model: 'chiefComplaint',
        select: 'chiefComplaint.chiefComplaintId',
        populate: [
          {
            path: 'productionArea.productionAreaId',
            model: 'productionArea',
            select: 'paName',
          },
        ],
      },
      {
        path: 'patientId',
        model: 'patientfhir',
        select: 'name identifier',
      },
    ]);

  res.status(200).json({
    success: true,
    data: notes,
  });
});

exports.currentTimeInterval = asyncHandler(async (req, res, next) => {
  const patientsTime = await EDR.aggregate([
    {
      $match: {
        $and: [{ status: 'pending' }, { currentLocation: 'ED' }],
      },
    },
    {
      $project: {
        patientId: 1,
        createdTimeStamp: 1,
        dateDifference: {
          $divide: [
            {
              $subtract: [new Date(), '$createdTimeStamp'],
            },
            1000 * 60 * 60 * 24,
          ],
        },
      },
    },
  ]);

  patientsTime.map(
    (day) => (day.days = day.dateDifference.toString().split('.')[0])
  );

  patientsTime.map((patient) => {
    const h = patient.dateDifference;
    const int = Math.trunc(h);
    const float = Number((h - int).toFixed(8));
    patient.hours = Math.trunc(float * 24);
  });

  const patients = await EDR.populate(patientsTime, [
    {
      path: 'patientId',
      model: 'patientfhir',
      select: 'identifier name gender age weight',
    },
  ]);

  res.status(200).json({
    success: true,
    data: patients,
  });
});

exports.getCurrentLabTest = asyncHandler(async (req, res, next) => {
  const labs = await EDR.find({
    status: 'pending',
    labRequest: { $ne: [] },
    currentLocation: 'ED',
  })
    .select('patientId labRequest')
    .populate([
      {
        path: 'patientId',
        model: 'patientfhir',
        select: 'identifier name',
      },
      {
        path: 'room.roomId',
        model: 'room',
        select: 'roomId',
      },
    ]);

  // labs.map((lab) => (lab.totalTests = lab.labRequest.length));
  // console.log(labs[0].totalTests);
  res.status(200).json({
    success: true,
    data: labs,
  });
});

exports.getCurrentRadTest = asyncHandler(async (req, res, next) => {
  const rads = await EDR.find({
    status: 'pending',
    radRequest: { $ne: [] },
    currentLocation: 'ED',
  })
    .select('patientId radRequest')
    .populate([
      {
        path: 'patientId',
        model: 'patientfhir',
        select: 'identifier name',
      },
      {
        path: 'room.roomId',
        model: 'room',
        select: 'roomId',
      },
    ]);

  // labs.map((lab) => (lab.totalTests = lab.labRequest.length));
  // console.log(labs[0].totalTests);
  res.status(200).json({
    success: true,
    data: rads,
  });
});

exports.getCriticalLabTest = asyncHandler(async (req, res, next) => {
  const labsEdr = await EDR.aggregate([
    {
      $project: {
        _id: 1,
        status: 1,
        patientId: 1,
        labRequest: 1,
        currentLocation: 1,
      },
    },
    {
      $match: {
        $and: [
          { status: 'pending' },
          { labRequest: { $ne: [] } },
          { currentLocation: 'ED' },
        ],
      },
    },
    {
      $unwind: '$labRequest',
    },
    {
      $match: { 'labRequest.priority': 'High' },
    },
  ]);

  const labs = await EDR.populate(labsEdr, [
    {
      path: 'patientId',
      model: 'patientfhir',
      select: 'identifier name',
    },
    {
      path: 'room.roomId',
      model: 'room',
      select: 'roomId',
    },
  ]);

  res.status(200).json({
    success: true,
    data: labs,
  });
});

exports.getDischargedRequirements = asyncHandler(async (req, res, next) => {
  const discharged = await EDR.find({ status: 'Discharged' })
    .select(
      'patientId room chiefComplaint dischargeRequest.dischargeSummary.edrCompletionRequirement'
    )
    .populate([
      {
        path: 'chiefComplaint.chiefComplaintId',
        model: 'chiefComplaint',
        select: 'chiefComplaint.chiefComplaintId',
        populate: [
          {
            path: 'productionArea.productionAreaId',
            model: 'productionArea',
            select: 'paName',
          },
        ],
      },
      {
        path: 'patientId',
        model: 'patientfhir',
        select: 'name identifier',
      },
      {
        path: 'room.roomId',
        model: 'room',
        select: 'roomId roomNo',
      },
    ]);

  res.status(200).json({
    success: true,
    data: discharged,
  });
});
