/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const asyncHandler = require('../middleware/async');
// const ErrorResponse = require('../utils/errorResponse');
const CareStream = require('../models/CareStreams/CareStreams');
const EDR = require('../models/EDR/EDR');
const Items = require('../models/item');
const Staff = require('../models/staffFhir/staff');
const Notification = require('../components/notification');
const Flag = require('../models/flag/Flag');
const searchEdrPatient = require('../components/searchEdr');
const generateReqNo = require('../components/requestNoGenerator');
const addLab = require('../components/addLab');
const addRad = require('../components/addRad');
const LabService = require('../models/service/lab');
const RadService = require('../models/service/radiology');

exports.addCareStream = asyncHandler(async (req, res, next) => {
  const {
    name,
    inclusionCriteria,
    exclusionCriteria,
    investigations,
    precautions,
    treatmentOrders,
    fluidsIV,
    medications,
    mdNotification,
    reassessments,
    createdBy,
  } = req.body;
  const MRN = [
    {
      value: generateReqNo('CS'),
    },
  ];
  const careStream = await CareStream.create({
    identifier: MRN,
    name,
    inclusionCriteria,
    exclusionCriteria,
    investigations,
    precautions,
    treatmentOrders,
    fluidsIV,
    medications,
    mdNotification,
    reassessments,
    createdBy,
  });
  res.status(201).json({
    success: true,
    data: careStream,
  });
});

exports.getAllCareStreams = asyncHandler(async (req, res, next) => {
  const careStreams = await CareStream.paginate({ disabled: false });
  res.status(200).json({
    success: true,
    data: careStreams,
  });
});

exports.getAllEnableDisableCareStreams = asyncHandler(
  async (req, res, next) => {
    const careStreams = await CareStream.paginate({});
    res.status(200).json({
      success: true,
      data: careStreams,
    });
  }
);

exports.disableCareStream = asyncHandler(async (req, res) => {
  const careStream = await CareStream.findOne({ _id: req.params.id });
  if (careStream.availability === false) {
    res.status(200).json({
      success: false,
      data: 'CareStream not availabele for disabling',
    });
  } else if (careStream.disabled === true) {
    res
      .status(200)
      .json({ success: false, data: 'CareStream already disabled' });
  } else {
    const updateRecord = {
      updatedAt: Date.now(),
      updatedBy: req.body.staffId,
      reason: req.body.reason,
    };
    await CareStream.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: { disabled: true },
        $push: { updateRecord },
      }
    );
    res
      .status(200)
      .json({ success: true, data: 'CareStream status changed to disable' });
  }
});

exports.enableCareStreamService = asyncHandler(async (req, res) => {
  const careStream = await CareStream.findOne({ _id: req.params.id });
  if (careStream.disabled === true) {
    const updateRecord = {
      updatedAt: Date.now(),
      updatedBy: req.body.staffId,
      reason: req.body.reason,
    };
    await CareStream.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: { disabled: false },
        $push: { updateRecord },
      }
    );
    res
      .status(200)
      .json({ success: true, data: 'careStream status changed to enable' });
  } else {
    res
      .status(200)
      .json({ success: false, data: 'careStream already enabled' });
  }
});

exports.getMedicationsCareStreams = asyncHandler(async (req, res, next) => {
  const careStreams = await CareStream.find().select({
    name: 1,
    _id: 1,
    identifier: 1,
    createdAt: 1,
  });
  res.status(200).json({
    success: true,
    data: careStreams,
  });
});
exports.getMedicationsByIdCareStreams = asyncHandler(async (req, res, next) => {
  const careStreams = await CareStream.findOne({ _id: req.params.id }).select({
    medications: 1,
    _id: 0,
  });
  res.status(200).json({
    success: true,
    data: careStreams,
  });
});

exports.getCSPatients = asyncHandler(async (req, res, next) => {
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
  const csPatients = await EDR.find({
    status: 'pending',
    // careStream: { $eq: [] },
    // room: { $ne: [] },
    'chiefComplaint.chiefComplaintId': chiefComplaintId,
  }).populate('patientId');

  res.status(200).json({
    success: true,
    data: csPatients,
  });
});

exports.asignCareStream = asyncHandler(async (req, res, next) => {
  const edrCheck = await EDR.find({ _id: req.body.data.edrId }).populate(
    'patientId'
  );

  const latestCS = edrCheck[0].careStream.length - 1;
  const updatedVersion = latestCS + 2;
  const versionNo = edrCheck[0].requestNo + '-' + updatedVersion;

  const careStream = {
    versionNo,
    name: req.body.data.name,
    inclusionCriteria: req.body.data.inclusionCriteria,
    exclusionCriteria: req.body.data.exclusionCriteria,
    careStreamId: req.body.data.careStreamId,
    assignedBy: req.body.data.staffId,
    assignedTime: Date.now(),
    reason: req.body.data.reason,
    status: 'in_progress',
  };

  const edrCS = await EDR.findOneAndUpdate(
    { _id: req.body.data.edrId },
    { $push: { careStream } },
    { new: true }
  ).populate('careStream.careStreamId', 'identifier');

  const assignedCareStream = await EDR.findOneAndUpdate(
    {
      _id: req.body.data.edrId,
      'careStream._id': edrCS.careStream[edrCS.careStream.length - 1]._id,
    },
    {
      $push: {
        'careStream.$.investigations.data': req.body.data.investigations,
        'careStream.$.precautions.data': req.body.data.precautions,
        'careStream.$.treatmentOrders.data': req.body.data.treatmentOrders,
        'careStream.$.fluidsIV.data': req.body.data.fluidsIV,
        'careStream.$.medications.data': req.body.data.medications,
        'careStream.$.mdNotification.data': req.body.data.mdNotification,
        'careStream.$.reassessments.data': req.body.data.reassessments,
      },
    }
  ).populate('careStream.careStreamId', 'identifier');

  const pharmacyRequest = edrCheck[0].pharmacyRequest;
  const filteredMedications = req.body.data.medications.filter(
    (t) => t.selected === true
  );

  const filteredFluids = req.body.data.fluidsIV.filter(
    (t) => t.selected === true
  );

  const filteredItem = [...filteredMedications, ...filteredFluids];

  if (filteredItem.length > 0) {
    for (let i = 0; i < filteredItem.length; i++) {
      const item = await Items.findOne({
        name: filteredItem[i].itemName,
      });

      const pharmacyRequestNo = generateReqNo('PHR');
      const pharmaObj = {
        pharmacyRequestNo,
        requestedBy: req.body.data.staffId,
        reconciliationNotes: [],
        generatedFrom: 'CareStream Request',
        careStreamId: req.body.data.careStreamId,
        pharmacyCSId: filteredItem[i]._id,
        item: {
          itemId: item._id,
          itemType: item.medClass.toLowerCase(),
          itemName: item.name,
          requestedQty: filteredItem[i].requestedQty,
          priority: '',
          schedule: '',
          dosage: filteredItem[i].dosage,
          frequency: filteredItem[i].frequency,
          duration: filteredItem[i].duration,
          form: '',
          size: '',
          make_model: '',
          additionalNotes: '',
        },
        status: 'pending',
        secondStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      pharmacyRequest.push(pharmaObj);
    }

    await EDR.findOneAndUpdate(
      { _id: req.body.data.edrId },
      { $push: { pharmacyRequest: pharmacyRequest } },
      { new: true }
    );
    //     Notification(
    //       'Medication',
    //       'Medication Of CareStream',
    //       'Nurses',
    //       'Pharmacist',
    //       '/dashboard/home/patientmanagement/viewrequests/pharma/viewpharma',
    //       req.body.data.edrId,
    //       '',
    //       'ED Nurse'
    //     );

    //     // Clinical Pharmacist
    //     Notification(
    //       'Care Stream Medication Request',
    //       'Care Stream Medication Request',
    //       'Clinical Pharmacist',
    //       'CareStream Assigned',
    //       '/dashboard/home/pharmanotes',
    //       req.body.edrId,
    //       '',
    //       ''
    //     );
  }

  //   // * Assigning tests
  //   if (req.body.data.investigations) {
  //     const { investigations } = req.body.data;

  //     const tests = investigations.filter((t) => t.selected === true);
  //     for (const test of tests) {
  //       if (test.testType === 'lab') {
  //         const lab = await LabService.findOne({ name: test.name });
  //         const data = {
  //           staffId: req.body.data.staffId,
  //           edrId: req.body.data.edrId,
  //           name: lab.name,
  //           serviceId: lab._id,
  //           price: lab.price,
  //           type: lab.type,
  //           careStreamId: req.body.data.careStreamId,
  //           labTestId: test._id,
  //         };
  //         addLab(data);
  //       } else if (test.testType === 'rad') {
  //         const rad = await RadService.findOne({ name: test.name });
  //         const data = {
  //           staffId: req.body.data.staffId,
  //           edrId: req.body.data.edrId,
  //           name: rad.name,
  //           serviceId: rad._id,
  //           price: rad.price,
  //           type: rad.type,
  //           careStreamId: req.body.data.careStreamId,
  //           radTestId: test._id,
  //         };
  //         addRad(data);
  //       }
  //     }
  //   }

  //   const decisionPending = await EDR.find({
  //     careStream: { $eq: [] },
  //     doctorNotes: { $ne: [] },
  //   });

  //   if (decisionPending.length > 5) {
  //     await Flag.create({
  //       edrId: req.body.data.edrId,
  //       generatedFrom: 'Sensei',
  //       card: '4th',
  //       generatedFor: ['Sensei', 'Medical Director'],
  //       reason: 'Patients pending for Doctor Decisions',
  //       createdAt: Date.now(),
  //     });
  //     const flags = await Flag.find({
  //       generatedFrom: 'Sensei',
  //       status: 'pending',
  //     });
  //     globalVariable.io.emit('pendingSensei', flags);
  //   }

  //   if (decisionPending.length > 6) {
  //     await Flag.create({
  //       edrId: req.body.data.edrId,
  //       generatedFrom: 'ED Doctor',
  //       card: '2nd',
  //       generatedFor: ['ED Doctor', 'Medical Director'],
  //       reason: 'Patients pending for Doctor Decisions',
  //       createdAt: Date.now(),
  //     });
  //     const flags = await Flag.find({
  //       generatedFrom: ['ED Doctor', 'Medical Director'],
  //       status: 'pending',
  //     });
  //     globalVariable.io.emit('pendingDoctor', flags);
  //   }

  //   const currentStaff = await Staff.findById(req.body.data.staffId).select(
  //     'staffType'
  //   );

  //   if (currentStaff.staffType === 'Paramedics') {
  //     Notification(
  //       'Patient Details',
  //       'Patient Details',
  //       'Sensei',
  //       'Paramedics',
  //       '/dashboard/home/pendingregistration',
  //       req.body.data.edrId,
  //       '',
  //       ''
  //     );
  //   }

  //   Notification(
  //     'careStream Assigned',
  //     'careStream Assigned',
  //     'Nurses',
  //     'CareStream',
  //     '/dashboard/home/notes',
  //     req.body.data.edrId,
  //     '',
  //     'ED Nurse'
  //   );

  //   Notification(
  //     'careStream Assigned',
  //     'Doctor assigned CareStream',
  //     'Doctor',
  //     'CareStream Assigned',
  //     '/dashboard/home/notes',
  //     req.body.data.edrId,
  //     '',
  //     'Rad Doctor'
  //   );

  res.status(200).json({
    success: true,
    data: assignedCareStream,
  });
});

// Update Care Stream
exports.updateCareStream = asyncHandler(async (req, res, next) => {
  const { investigations, medications, fluidsIV } = req.body.data;
  const CSData = await EDR.findById(req.body.data.edrId).select('careStream');
  const tests = [];

  const CS = CSData.careStream[0].investigations.data;

  for (let i = 0; i < investigations.data.length; i++) {
    for (let j = 0; j < CS.length; j++) {
      if (investigations.data[i]._id === CS[j]._id) {
        if (
          investigations.data[i].selected === true &&
          CS[j].selected === false
        ) {
          tests.push(investigations.data[i]);
        }
      }
    }
  }

  const newMedications = [];
  const CSMedications = CSData.careStream[0].medications.data;
  for (let i = 0; i < medications.data.length; i++) {
    for (let j = 0; j < CSMedications.length; j++) {
      if (medications.data[i]._id === CSMedications[j]._id) {
        if (
          medications.data[i].selected === true &&
          CSMedications[j].selected === false
        ) {
          newMedications.push(investigations.data[i]);
        }
      }
    }
  }

  if (newMedications.length > 0) {
    for (let i = 0; i < newMedications.length; i++) {
      const item = await Items.findOne({
        name: newMedications[i].itemName,
      });

      const pharmacyRequestNo = generateReqNo('PHR');
      const pharmaObj = {
        pharmacyRequestNo,
        requestedBy: req.body.data.staffId,
        reconciliationNotes: [],
        generatedFrom: 'CareStream Request',
        item: {
          itemId: item._id,
          itemType: item.medClass.toLowerCase(),
          itemName: item.name,
          requestedQty: medications.data[i].requestedQty,
          priority: '',
          schedule: '',
          dosage: medications.data[i].dosage,
          frequency: medications.data[i].frequency,
          duration: medications.data[i].duration,
          form: '',
          size: '',
          make_model: '',
          additionalNotes: '',
        },
        status: 'pending',
        secondStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      pharmacyRequest.push(pharmaObj);
    }



    await EDR.findOneAndUpdate(
      { _id: req.body.data.edrId },
      { $push: { pharmacyRequest: pharmacyRequest } },
      { new: true }
    );

  }

  const newfluidsIV = [];
  const CSFluids = CSData.careStream[0].fluidsIV.data;
  for (let i = 0; i < fluidsIV.data.length; i++) {
    for (let j = 0; j < CSFluids.length; j++) {
      if (fluidsIV.data[i]._id === CSFluids[j]._id) {
        if (
          fluidsIV.data[i].selected === true &&
          CSFluids[j].selected === false
        ) {
          newfluidsIV.push(investigations.data[i]);
        }
      }
    }
  }

  if (newfluidsIV.length > 0) {
    for (let i = 0; i < newfluidsIV.length; i++) {
      const item = await Items.findOne({
        name: newfluidsIV[i].itemName,
      });

      const pharmacyRequestNo = generateReqNo('PHR');
      const pharmaObj = {
        pharmacyRequestNo,
        requestedBy: req.body.data.staffId,
        reconciliationNotes: [],
        generatedFrom: 'CareStream Request',
        item: {
          itemId: item._id,
          itemType: item.medClass.toLowerCase(),
          itemName: item.name,
          requestedQty: fluidsIV.data[i].requestedQty,
          priority: '',
          schedule: '',
          dosage: fluidsIV.data[i].dosage,
          frequency: fluidsIV.data[i].frequency,
          duration: fluidsIV.data[i].duration,
          form: '',
          size: '',
          make_model: '',
          additionalNotes: '',
        },
        status: 'pending',
        secondStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      pharmacyRequest.push(pharmaObj);
    }

    await EDR.findOneAndUpdate(
      { _id: req.body.data.edrId },
      { $push: { pharmacyRequest: pharmacyRequest } },
      { new: true }
    );
  }

  await EDR.findOneAndUpdate(
    {
      _id: req.body.data.edrId,
      'careStream._id': req.body.data.careStreamId,
    },
    {
      $set: {
        'careStream.$.investigations.data': req.body.data.investigations.data,
        'careStream.$.precautions.data': req.body.data.precautions.data,
        'careStream.$.treatmentOrders.data': req.body.data.treatmentOrders.data,
        'careStream.$.fluidsIV.data': req.body.data.fluidsIV.data,
        'careStream.$.medications.data': req.body.data.medications.data,
        'careStream.$.mdNotification.data': req.body.data.mdNotification.data,
        'careStream.$.reassessments.data': req.body.data.reassessments.data,
      },
    }
  );

  //   for (const test of tests) {
  //     if (test.testType === 'lab') {
  //       const lab = await LabService.findOne({ name: test.name });
  //       const data = {
  //         staffId: req.body.data.staffId,
  //         edrId: req.body.data.edrId,
  //         name: lab.name,
  //         serviceId: lab._id,
  //         price: lab.price,
  //         type: lab.type,
  //         careStreamId: req.body.data.careStreamId,
  //       };
  //       addLab(data);
  //     } else if (test.testType === 'rad') {
  //       const rad = await RadService.findOne({ name: test.name });
  //       const data = {
  //         staffId: req.body.data.staffId,
  //         edrId: req.body.data.edrId,
  //         name: rad.name,
  //         serviceId: rad._id,
  //         price: rad.price,
  //         type: rad.type,
  //         careStreamId: req.body.data.careStreamId,
  //       };
  //       addRad(data);
  //     }
  //   }
});

exports.getInProgressCS = asyncHandler(async (req, res, next) => {
  const unwind = await EDR.aggregate([
    {
      $unwind: '$careStream',
    },
    {
      $match: {
        $and: [{ status: 'pending' }, { 'careStream.status': 'in_progress' }],
      },
    },
  ]);
  const inProgressCS = await EDR.populate(unwind, [
    {
      path: 'chiefComplaint.chiefComplaintId',
      model: 'chiefComplaint',
      select: 'chiefComplaint.chiefComplaintId',

      populate: [
        {
          path: 'productionArea.productionAreaId',
          model: 'productionArea',
          select: 'paName',
          // populate: [
          //   {
          //     path: 'rooms.roomId',
          //     model: 'room',
          //     select: 'roomNo',
          //   },
          // ],
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
      path: 'careStream.careStreamId',
      model: 'careStream',
      select: 'identifier',
    },
  ]);

  res.status(200).json({
    success: true,
    data: inProgressCS,
  });
});

exports.edInProgressCS = asyncHandler(async (req, res, next) => {
  const unwind = await EDR.aggregate([
    {
      $project: {
        careStream: 1,
        status: 1,
        chiefComplaint: 1,
        patientId: 1,
        room: 1,
      },
    },
    {
      $unwind: '$careStream',
    },
    {
      $match: {
        $and: [{ status: 'pending' }, { 'careStream.status': 'in_progress' }],
      },
    },
    {
      $project: {
        'careStream.careStreamId': 1,
        'careStream._id': 1,
        'careStream.assignedTime': 1,
        'careStream.status': 1,
        chiefComplaint: 1,
        patientId: 1,
        room: 1,
      },
    },
  ]);

  const inProgressCS = await EDR.populate(unwind, [
    {
      path: 'careStream.careStreamId',
      select: 'identifier name',
    },
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
      select: 'roomNo',
    },
  ]);

  res.status(200).json({
    success: true,
    data: inProgressCS,
  });
});

exports.searchInProgressCS = asyncHandler(async (req, res, next) => {
  const arr = [];
  const edrs = await EDR.aggregate([
    {
      $project: {
        status: 1,
        careStream: 1,
        patientId: 1,
        chiefComplaint: 1,
      },
    },
    {
      $unwind: '$careStream',
    },
    {
      $match: {
        'careStream.status': 'in_progress',
      },
    },
  ]);
  const patients = await EDR.populate(edrs, [
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
      path: 'careStream.careStreamId',
      select: 'identifier name',
    },
  ]);

  for (let i = 0; i < patients.length; i++) {
    // for (let j = 0; j < patients[i].careStream.length; j++) {
    if (
      (patients[i].careStream.careStreamId.name &&
        patients[i].careStream.careStreamId.name
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].careStream.careStreamId.identifier[0].value &&
        patients[i].careStream.careStreamId.identifier[0].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].chiefComplaint[patients[i].chiefComplaint.length - 1]
        .chiefComplaintId.productionArea[0].productionAreaId.paName &&
        patients[i].chiefComplaint[
          patients[i].chiefComplaint.length - 1
        ].chiefComplaintId.productionArea[0].productionAreaId.paName
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase()))
    ) {
      arr.push(patients[i]);
    }
    // }
  }
  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.completeCareStream = asyncHandler(async (req, res, next) => {
  const completedCS = await EDR.findOneAndUpdate(
    { _id: req.body.edrId, 'careStream._id': req.body.csId },
    {
      $set: {
        'careStream.$.status': 'completed',
        'careStream.$.completedBy': req.body.staffId,
        'careStream.$.completedTime': Date.now(),
      },
    },
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: completedCS,
  });
});

exports.getCompletedCS = asyncHandler(async (req, res, next) => {
  const unwind = await EDR.aggregate([
    {
      $project: {
        careStream: 1,
        status: 1,
        chiefComplaint: 1,
        patientId: 1,
      },
    },
    {
      $unwind: '$careStream',
    },
    {
      $match: {
        'careStream.status': 'completed',
      },
    },
    {
      $project: {
        'careStream.careStreamId': 1,
        'careStream._id': 1,
        'careStream.assignedTime': 1,
        'careStream.status': 1,
        chiefComplaint: 1,
        patientId: 1,
      },
    },
  ]);

  const inProgressCS = await EDR.populate(unwind, [
    {
      path: 'careStream.careStreamId',
      select: 'identifier name',
    },
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
  ]);

  res.status(200).json({
    success: true,
    data: inProgressCS,
  });
});

exports.getPatientWithoutCSByKeyword = asyncHandler(async (req, res, next) => {
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
    status: 'pending',
    // careStream: { $eq: [] },
    // room: { $ne: [] },
    'chiefComplaint.chiefComplaintId': chiefComplaintId,
  }).populate('patientId ');

  const arr = searchEdrPatient(req, patients);

  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.getPatientsWithCSByKeyword = asyncHandler(async (req, res, next) => {
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
    status: 'pending',
    // careStream: { $ne: [] },
    room: { $ne: [] },
    'chiefComplaint.chiefComplaintId': chiefComplaintId,
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
      path: 'room.roomId',
      model: 'room',
    },
    {
      path: 'patientId',
      model: 'patientfhir',
    },
    {
      path: 'careStream.careStreamId',
      model: 'careStream',
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
      path: 'room.roomId',
      model: 'room',
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

exports.getEDRswithCS = asyncHandler(async (req, res, next) => {
  let patients;
  if (req.params.staffId) {
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

    patients = await EDR.find({
      status: 'pending',
      // careStream: { $ne: [] },
      room: { $ne: [] },
      'chiefComplaint.chiefComplaintId': chiefComplaintId,
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
          path: 'room.roomId',
          model: 'room',
        },
        {
          path: 'patientId',
          model: 'patientfhir',
        },
        {
          path: 'careStream.careStreamId',
          model: 'careStream',
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
          path: 'room.roomId',
          model: 'room',
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
          path: 'eouBed.bedId',
          model: 'Bed',
          select: 'bedId bedNo',
        },
      ])
      .populate('newChiefComplaint.newChiefComplaintId');
  } else {
    patients = await EDR.find({
      status: 'pending',
      // careStream: { $ne: [] },
      room: { $ne: [] },
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
          path: 'room.roomId',
          model: 'room',
        },
        {
          path: 'patientId',
          model: 'patientfhir',
        },
        {
          path: 'careStream.careStreamId',
          model: 'careStream',
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
          path: 'room.roomId',
          model: 'room',
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
          path: 'eouBed.bedId',
          model: 'Bed',
          select: 'bedId bedNo',
        },
      ])
      .populate('newChiefComplaint.newChiefComplaintId');
  }

  res.status(200).json({
    success: true,
    data: patients,
  });
});
