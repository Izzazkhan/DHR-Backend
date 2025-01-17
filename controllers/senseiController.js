const moment = require('moment');
const Staff = require('../models/staffFhir/staff');
const asyncHandler = require('../middleware/async');
const EDR = require('../models/EDR/EDR');
const PA = require('../models/productionArea');
const CC = require('../models/chiefComplaint/chiefComplaint');
const NewCC = require('../models/newChiefComplaint');
const CS = require('../models/CareStreams/CareStreams');
const ErrorResponse = require('../utils/errorResponse');
const EouTransfer = require('../models/patientTransferEDEOU/patientTransferEDEOU');
const Room = require('../models/room');
const searchEdrPatient = require('../components/searchEdr');
const TOC = require('../models/TransferOfCare');
const TransferToEDEOU = require('../models/patientTransferEDEOU/patientTransferEDEOU');

exports.updateStaffShift = asyncHandler(async (req, res, next) => {
  const staff = await Staff.findOne({ _id: req.body.staffId });
  if (!staff || staff.disabled === true) {
    return res.status(200).json({ success: false, data: 'Staff disabled' });
  }
  const chiefComplaintId = await CC.findOne({
    'productionArea.productionAreaId': req.body.productionAreaId,
  });

  const chiefComplaint = {
    assignedBy: req.body.assignedBy,
    chiefComplaintId: chiefComplaintId._id,
    assignedTime: Date.now(),
  };
  let updatedStaff;
  updatedStaff = await Staff.findOneAndUpdate(
    { _id: staff.id },
    { $push: { chiefComplaint } },
    {
      new: true,
    }
  );
  updatedStaff = await Staff.findOneAndUpdate(
    { _id: staff.id },
    {
      $set: {
        shift: req.body.shift,
      },
    },
    {
      new: true,
    }
  );
  const updateRecord = {
    updatedAt: Date.now(),
    updatedBy: req.body.assignedBy,
    reason: req.body.reason,
  };

  updatedStaff = await Staff.findOneAndUpdate(
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
});

exports.getCCPatients = asyncHandler(async (req, res, next) => {
  const patients = await EDR.find({
    status: 'pending',
    newChiefComplaint: { $ne: [] },
    patientInHospital: true,
  })
    .populate([
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
    ])
    .populate('newChiefComplaint.newChiefComplaintId');

  const newArray = [];
  for (let i = 0; i < patients.length; i++) {
    let count = 1;

    const obj = JSON.parse(JSON.stringify(patients[i]));
    const x =
      patients[i].newChiefComplaint[patients[i].newChiefComplaint.length - 1]
        .newChiefComplaintId._id;
    for (let j = 0; j < patients.length; j++) {
      const y =
        patients[j].newChiefComplaint[patients[j].newChiefComplaint.length - 1]
          .newChiefComplaintId._id;
      if (x === y && patients[i]._id !== patients[j]._id) {
        count++;
      }
    }

    obj.count = count;
    newArray.push(obj);
  }

  res.status(200).json({
    success: true,
    data: newArray,
  });
});

exports.getCCPatientsED = asyncHandler(async (req, res, next) => {
  const patients = await EDR.find({
    status: 'pending',
    newChiefComplaint: { $ne: [] },
    patientInHospital: true,
    currentLocation: 'ED',
  })
    .populate([
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
    ])
    .populate('newChiefComplaint.newChiefComplaintId');

  const newArray = [];
  for (let i = 0; i < patients.length; i++) {
    let count = 1;

    const obj = JSON.parse(JSON.stringify(patients[i]));
    const x =
      patients[i].newChiefComplaint[patients[i].newChiefComplaint.length - 1]
        .newChiefComplaintId._id;
    for (let j = 0; j < patients.length; j++) {
      const y =
        patients[j].newChiefComplaint[patients[j].newChiefComplaint.length - 1]
          .newChiefComplaintId._id;
      if (x === y && patients[i]._id !== patients[j]._id) {
        count++;
      }
    }

    obj.count = count;
    newArray.push(obj);
  }

  res.status(200).json({
    success: true,
    data: newArray,
  });
});

exports.searchCCPatients = asyncHandler(async (req, res, next) => {
  const patients = await EDR.find({
    status: 'pending',
    newChiefComplaint: { $ne: [] },
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

  const arr = searchEdrPatient(req, patients);

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
  const rooms = await EDR.findOne({
    'room.roomId': req.params.roomId,
    room: { $ne: [] },
  }).select('room');

  const latestRoom = rooms.room.length - 1;

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
  const chiefComplaint = await NewCC.find({
    productionArea: { $ne: [] },
  });
  const oneMonth = moment().subtract(30, 'd').utc().toDate();

  const edrCC = await EDR.aggregate([
    {
      $match: {
        newChiefComplaint: { $ne: [] },
      },
    },
    {
      $project: {
        latestCC: { $slice: ['$newChiefComplaint', -1] },
        status: 1,
        currentLocation: 1,
        patientInHospital: 1,
      },
    },
    {
      $unwind: '$latestCC',
    },
    {
      $match: {
        $and: [
          { 'latestCC.assignedTime': { $gte: oneMonth } },
          { status: 'Discharged' },
          { currentLocation: 'ED' },
          { patientInHospital: true },
        ],
      },
    },
  ]);

  let count = 0;
  const newArray = [];

  for (let i = 0; i < chiefComplaint.length; i++) {
    const obj = JSON.parse(JSON.stringify(chiefComplaint[i]));
    count = 0;
    for (let j = 0; j < edrCC.length; j++) {
      const latestCC = edrCC[j].latestCC.newChiefComplaintId;

      if (chiefComplaint[i]._id.toString() === latestCC.toString()) {
        count++;
      }
    }
    obj.count = count;
    newArray.push(obj);
  }

  res.status(200).json({
    success: true,
    data: newArray,
  });
});

exports.getCR = asyncHandler(async (req, res, next) => {
  const cr = await EDR.find({
    consultationNote: { $ne: [] },
  })
    .populate([
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
    ])
    .populate('newChiefComplaint.newChiefComplaintId');

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
    {
      path: 'chiefComplaint.chiefComplaintId',
      model: 'chiefComplaint',
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
      path: 'room.roomId',
      model: 'room',
      select: 'roomNo',
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
  const arr = searchEdrPatient(req, patients);

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

  const arr = searchEdrPatient(req, patients);

  res.status(200).json({
    success: true,
    data: arr,
  });
});

// Stats for ED Room History

exports.CSByEDCells = asyncHandler(async (req, res, next) => {
  const rooms = await Room.find().select('_id roomNo roomId');
  const oneMonth = moment().subtract(30, 'd').utc().toDate();

  const patients = await EDR.find({
    status: 'Discharged',
    currentLocation: 'ED',
    dischargeTimestamp: { $gte: oneMonth },
    careStream: { $ne: [] },
    room: { $ne: [] },
  }).select('careStream.name room');

  const allRooms = [];

  for (let i = 0; i < rooms.length; i++) {
    let obj = {};
    const room = [];
    for (let j = 0; j < patients.length; j++) {
      const latestRoom = patients[j].room[patients[j].room.length - 1].roomId;

      obj = JSON.parse(JSON.stringify(patients[j]));

      if (rooms[i]._id.toString() === latestRoom.toString()) {
        obj.roomDBId = rooms[i]._id;
        obj.roomId = rooms[i].roomId;
        obj.roomNo = rooms[i].roomNo;
        delete obj.room;
        room.push(obj);
      }
    }

    allRooms.push(room);
  }

  const data = allRooms.filter(String);

  const totalData = [];
  let obj2 = {};
  for (let i = 0; i < data.length; i++) {
    let totalCS = 0;
    for (let j = 0; j < data[i].length; j++) {
      obj2 = JSON.parse(JSON.stringify(data[i][j]));
      totalCS += data[i][j].careStream.length;
      obj2.totalCS = totalCS;
    }
    totalData.push(obj2);
  }

  res.status(200).json({
    success: true,
    data: totalData,
  });
});

exports.codeBlueCalls = asyncHandler(async (req, res, next) => {
  const rooms = await Room.find().select('_id roomNo roomId');
  const oneMonth = moment().subtract(30, 'd').utc().toDate();

  const patients = await EDR.find({
    status: 'Discharged',
    currentLocation: 'ED',
    dischargeTimestamp: { $gte: oneMonth },
    codeBlueTeam: { $ne: [] },
  })
    .select('codeBlueTeam room')
    .populate('codeBlueTeam.teamId', 'teamName');

  const allRooms = [];

  for (let i = 0; i < rooms.length; i++) {
    let obj = {};
    const room = [];
    for (let j = 0; j < patients.length; j++) {
      const latestRoom = patients[j].room[patients[j].room.length - 1].roomId;

      obj = JSON.parse(JSON.stringify(patients[j]));

      if (rooms[i]._id.toString() === latestRoom.toString()) {
        obj.roomDBId = rooms[i]._id;
        obj.roomId = rooms[i].roomId;
        obj.roomNo = rooms[i].roomNo;
        delete obj.room;
        room.push(obj);
      }
    }

    allRooms.push(room);
  }

  const data = allRooms.filter(String);

  const totalData = [];
  let obj2 = {};
  for (let i = 0; i < data.length; i++) {
    let totalCB = 0;
    for (let j = 0; j < data[i].length; j++) {
      obj2 = JSON.parse(JSON.stringify(data[i][j]));
      totalCB += data[i][j].codeBlueTeam.length;
      obj2.totalCB = totalCB;
    }
    totalData.push(obj2);
  }

  res.status(200).json({
    success: true,
    data: totalData,
  });
});

exports.timeInterval = asyncHandler(async (req, res, next) => {
  const oneMonth = moment().subtract(30, 'd').utc().toDate();
  const patientsTime = await EDR.aggregate([
    {
      $match: {
        $and: [
          { status: 'Discharged' },
          { currentLocation: 'ED' },
          { dischargeTimestamp: { $gte: oneMonth } },
        ],
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

  // console.log(patientsTime);

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
  // const currentTime = moment().utc().toDate();
  // const sixHours = moment().subtract(6, 'hours').utc().toDate();

  // const week = new Date();
  // const weekDate = week.setDate(week.getDate() - 7);
  // console.log(weekDate);

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
  const oneMonth = moment().subtract(30, 'd').utc().toDate();
  const discharged = await EDR.find({
    status: 'Discharged',
    currentLocation: 'ED',
    dischargeTimestamp: { $gte: oneMonth },
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

  res.status(200).json({
    success: true,
    data: labs,
  });
});

exports.getRadTest = asyncHandler(async (req, res, next) => {
  const rads = await EDR.find({
    status: 'Discharged',
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
        select: 'roomId roomNo',
      },
    ]);
  // labs.map((lab) => (lab.totalTests = lab.labRequest.length));

  res.status(200).json({
    success: true,
    data: rads,
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

exports.getEDCSPatients = asyncHandler(async (req, res, next) => {
  const patients = await EDR.aggregate([
    {
      $project: {
        status: 1,
        currentLocation: 1,
        careStream: 1,
        patientId: 1,
        patientInHospital: 1,
        chiefComplaint: 1,
        room: 1,
      },
    },
    {
      $unwind: '$careStream',
    },
    {
      $match: {
        $and: [
          { status: 'Discharged' },
          { currentLocation: 'ED' },
          { 'careStream.status': 'completed' },
          { patientInHospital: true },
        ],
      },
    },
    {
      $project: {
        chiefComplaint: 1,
        room: 1,
        careStream: 1,
      },
    },
  ]);

  const csPatients = await EDR.populate(patients, [
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
      path: 'room.roomId',
      model: 'room',
      select: 'roomId',
    },
  ]);

  // console.log(patients);

  const newArray = [];
  const cs = await CS.find();
  for (let i = 0; i < cs.length; i++) {
    let count = 0;
    let obj = {};
    for (let j = 0; j < patients.length; j++) {
      obj = JSON.parse(JSON.stringify(patients[j]));
      if (
        cs[i]._id.toString() === patients[j].careStream.careStreamId.toString()
      ) {
        count++;
      }
    }
    obj.count = count;
    newArray.push(obj);
  }

  res.status(200).json({
    success: true,
    data: newArray,
  });
});

exports.getCSMedications = asyncHandler(async (req, res, next) => {
  const oneMonth = moment().subtract(30, 'd').utc().toDate();
  const csPatients = await EDR.aggregate([
    {
      $project: {
        // pharmacyRequest: 1,
        status: 1,
        dischargeTimestamp: 1,
        currentLocation: 1,
        careStream: 1,
        chiefComplaint: 1,
        patientId: 1,
        room: 1,
      },
    },
    // {
    //   $unwind: '$careStream',
    // },
    {
      $match: {
        $and: [
          { status: 'Discharged' },
          { currentLocation: 'ED' },
          { dischargeTimestamp: { $gt: oneMonth } },
          { careStream: { $ne: [] } },
        ],
      },
    },
  ]);

  const CSMedications = await EDR.populate(csPatients, [
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
    data: CSMedications,
  });
});

// Stats For Current ED Room
exports.criticalFunctionCalling = asyncHandler(async (req, res, next) => {
  const edrs = await EDR.find({
    status: 'pending',
    codeBlueTeam: { $ne: [] },
    room: { $ne: [] },
    currentLocation: 'ED',
    patientInHospital: true,
  })
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
    ])
    .populate('codeBlueTeam.teamId', 'teamName')
    .select('patientId codeBlueTeam chiefComplaint');

  res.status(200).json({
    success: true,
    data: edrs,
  });
});

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
    newChiefComplaint: { $ne: [] },
    patientInHospital: true,
  })
    .select('patientId newChiefComplaint')
    .populate([
      {
        path: 'chiefComplaint.chiefComplaintId',
        model: 'chiefComplaint',
        select: 'chiefComplaintId name',
      },
    ])
    .populate('newChiefComplaint.newChiefComplaintId');

  const newArray = [];
  const cc = await NewCC.find();
  for (let i = 0; i < cc.length; i++) {
    let count = 0;
    const obj = JSON.parse(JSON.stringify(cc[i]));
    for (let j = 0; j < patients.length; j++) {
      if (
        cc[i]._id.toString() ===
        patients[j].newChiefComplaint[
          patients[j].newChiefComplaint.length - 1
        ].newChiefComplaintId._id.toString()
      ) {
        count++;
      }
    }
    obj.count = count;
    newArray.push(obj);
  }

  res.status(200).json({
    success: true,
    data: newArray,
  });
});

exports.getPatientTreatment = asyncHandler(async (req, res, next) => {
  const patients = await EDR.find({ status: 'pending', currentLocation: 'ED' })
    .select('patientId chiefComplaint ')
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
      {
        path: 'pharmacyRequest.reconciliationNotes.addedBy',
        model: 'staff',
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

  // console.log(patientsTime);

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
        select: 'identifier name gender age weight',
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
        select: 'identifier name gender age weight',
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

exports.deathOccurredPerCS = asyncHandler(async (req, res, next) => {
  const patients = await EDR.find({
    status: 'Discharged',
    currentLocation: 'ED',
    'dischargeRequest.dischargeSummary.edrCompletionReason': 'deceased',
    careStream: { $ne: [] },
  }).select('careStream.careStreamId');

  console.log(patients);

  const newArray = [];
  const cs = await CS.find().select('name');
  for (let i = 0; i < cs.length; i++) {
    let count = 0;
    const obj = JSON.parse(JSON.stringify(cs[i]));
    for (let j = 0; j < patients.length; j++) {
      if (
        cs[i]._id.toString() ===
        patients[j].careStream[
          patients[j].careStream.length - 1
        ].careStreamId.toString()
      ) {
        count++;
      }
    }
    obj.count = count;
    newArray.push(obj);
  }

  res.status(200).json({
    success: true,
    data: newArray,
  });
});

exports.chiefComplaintBeds = asyncHandler(async (req, res, next) => {
  const patients = await EDR.find({
    currentLocation: 'ED',
    status: 'pending',
    newChiefComplaint: { $ne: [] },
  })
    .select('patientId newChiefComplaint chiefComplaint')
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
    ])
    .populate('newChiefComplaint.newChiefComplaintId');

  res.status(200).json({
    success: true,
    data: patients,
  });
});

exports.csInProgress = asyncHandler(async (req, res, next) => {
  const unwind = await EDR.aggregate([
    {
      $project: {
        patientId: 1,
        careStream: 1,
        currentLocation: 1,
        status: 1,
      },
    },
    {
      $unwind: '$careStream',
    },
    {
      $match: {
        $and: [
          { 'careStream.status': 'in_progress' },
          { currentLocation: 'ED' },
          { status: 'pending' },
        ],
      },
    },
  ]);

  const patients = await EDR.populate(unwind, [
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

exports.medicationRequestsED = asyncHandler(async (req, res, next) => {
  const patients = await EDR.find({
    currentLocation: 'ED',
    status: 'pending',
    pharmacyRequest: { $ne: [] },
  })
    .select('patientId newChiefComplaint pharmacyRequest chiefComplaint')
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
    data: patients,
  });
});

exports.transferOfCare = asyncHandler(async (req, res, next) => {
  const oneMonth = moment().subtract(30, 'd').utc().toDate();
  const tocs = await TOC.find({ transferredAt: { $gte: oneMonth } }).populate([
    {
      path: 'edrId',
      select: 'patientId chiefComplaint',
      populate: [
        {
          path: 'patientId',
          select: 'identifier name',
        },
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
          path: 'room.roomId',
          model: 'room',
          select: 'roomId roomNo',
        },
      ],
    },
    {
      path: 'transferredTo',
      select: 'identifier name',
    },
    {
      path: 'transferredBy',
      select: 'identifier name',
    },
  ]);

  res.status(200).json({
    success: true,
    data: tocs,
  });
});

// Eou Stats
exports.getCSMedicationsEOU = asyncHandler(async (req, res, next) => {
  const oneMonth = moment().subtract(30, 'd').utc().toDate();
  const csPatients = await EDR.aggregate([
    {
      $project: {
        // pharmacyRequest: 1,
        status: 1,
        dischargeTimestamp: 1,
        currentLocation: 1,
        careStream: 1,
        chiefComplaint: 1,
        patientId: 1,
        room: 1,
        eouBed: 1,
      },
    },
    // {
    //   $unwind: '$careStream',
    // },
    {
      $match: {
        $and: [
          { status: 'Discharged' },
          { currentLocation: 'EOU' },
          { dischargeTimestamp: { $gt: oneMonth } },
          { careStream: { $ne: [] } },
        ],
      },
    },
  ]);

  const CSMedications = await EDR.populate(csPatients, [
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
    {
      path: 'eouBed.bedId',
      model: 'Bed',
      select: 'bedId bedNo',
    },
  ]);

  res.status(200).json({
    success: true,
    data: CSMedications,
  });
});

exports.careStreamStatus = asyncHandler(async (req, res, next) => {
  const oneMonth = moment().subtract(30, 'd').utc().toDate();
  const list = await TransferToEDEOU.find({
    from: 'ED',
    createdAt: { $gte: oneMonth },
  }).populate([
    {
      path: 'edrId',
      model: 'EDR',
      select: 'patientId room chiefComplaint careStream',
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

exports.eouTimeInterval = asyncHandler(async (req, res, next) => {
  const patientsTime = await EDR.aggregate([
    {
      $match: {
        $and: [{ status: 'Discharged' }, { currentLocation: 'EOU' }],
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

  // console.log(patientsTime);

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

exports.eouTransferRequest = asyncHandler(async (req, res, next) => {
  const transfers = await EouTransfer.find({
    to: 'EOU',
    status: 'pending',
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

exports.doctorResponseTime = asyncHandler(async (req, res, next) => {
  const time = await EDR.aggregate([
    {
      $project: {
        consultationNote: 1,
        status: 1,
        currentLocation: 1,
        patientId: 1,
        chiefComplaint: 1,
      },
    },
    {
      $match: {
        $and: [{ status: 'pending' }, { currentLocation: 'EOU' }],
      },
    },
    {
      $unwind: '$consultationNote',
    },
    {
      $match: {
        'consultationNote.status': 'complete',
      },
    },
    {
      $project: {
        patientId: 1,
        // consultationNote: 1,
        chiefComplaint: 1,
        'consultationNote.completionDate': 1,
        'consultationNote.consultant': 1,
        'consultationNote.noteTime': 1,
        responseTime: {
          $divide: [
            {
              $subtract: [
                '$consultationNote.completionDate',
                '$consultationNote.noteTime',
              ],
            },
            1000 * 60 * 60 * 24,
          ],
        },
      },
    },
  ]);

  time.map((day) => (day.days = day.responseTime.toString().split('.')[0]));

  time.map((patient) => {
    const h = patient.responseTime;
    const int = Math.trunc(h);
    const float = Number((h - int).toFixed(8));
    patient.hours = Math.trunc(float * 24);
  });

  const responseTime = await EDR.populate(time, [
    {
      path: 'patientId',
      model: 'patientfhir',
      select: 'identifier name gender age weight',
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
    {
      path: 'consultationNote.consultant',
      model: 'staff',
      select: 'name subType',
    },
  ]);

  res.status(200).json({
    success: true,
    data: responseTime,
  });
});

exports.patientShiftedInEOU = asyncHandler(async (req, res, next) => {
  const oneDay = moment().subtract(24, 'hours').utc().toDate();
  const oneWeek = moment().subtract(7, 'd').utc().toDate();
  const oneMonth = moment().subtract(30, 'd').utc().toDate();

  const oneDayTransfer = await EouTransfer.find({
    to: 'EOU',
    status: 'completed',
    completedAt: { $gt: oneDay },
  }).countDocuments();

  const oneWeekTransfer = await EouTransfer.find({
    to: 'EOU',
    status: 'completed',
    completedAt: { $gt: oneWeek },
  }).countDocuments();

  const oneMonthTransfer = await EouTransfer.find({
    to: 'EOU',
    status: 'completed',
    completedAt: { $gt: oneMonth },
  }).countDocuments();

  const obj = {
    oneDay: oneDayTransfer,
    oneWeek: oneWeekTransfer,
    oneMonth: oneMonthTransfer,
  };

  const arr = [];
  arr.push(obj);

  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.currentEOUPatients = asyncHandler(async (req, res, next) => {
  const eouPatients = await EDR.find({
    currentLocation: 'EOU',
    status: 'pending',
  })
    .select('patientId chiefComplaint')
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
        path: 'eouBed.bedId',
        model: 'Bed',
        select: 'bedId bedNo',
      },
    ]);

  res.status(200).json({
    success: true,
    data: eouPatients,
  });
});
