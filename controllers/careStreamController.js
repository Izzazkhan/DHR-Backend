const requestNoFormat = require('dateformat');
const asyncHandler = require('../middleware/async');
// const ErrorResponse = require('../utils/errorResponse');
const CareStream = require('../models/CareStreams/CareStreams');
const EDR = require('../models/EDR/EDR');
const Items = require('../models/item');
const Staff = require('../models/staffFhir/staff');
const Notification = require('../components/notification');

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
    createdBy,
  } = req.body;
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
      value: 'CS' + day + requestNoFormat(new Date(), 'yyHHMMss'),
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
  const csPatients = await EDR.find({
    status: 'pending',
    // careStream: { $eq: [] },
    // room: { $ne: [] },
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
    investigations: req.body.data.investigations,
    precautions: req.body.data.precautions,
    treatmentOrders: req.body.data.treatmentOrders,
    fluidsIV: req.body.data.fluidsIV,
    medications: req.body.data.medications,
    mdNotification: req.body.data.mdNotification,
    careStreamId: req.body.data.careStreamId,
    assignedBy: req.body.data.staffId,
    assignedTime: Date.now(),
    reason: req.body.data.reason,
    status: 'in_progress',
  };

  const pharmacyRequest = edrCheck[0].pharmacyRequest;

  if (req.body.data.medications && req.body.data.medications.length > 0) {
    for (let i = 0; i < req.body.data.medications.length; i++) {
      const item = await Items.findOne({
        name: req.body.data.medications[i].itemName,
      });

      console.log('Item : ', item);

      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 0);
      const diff =
        now -
        start +
        (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
      const oneDay = 1000 * 60 * 60 * 24;
      const day = Math.floor(diff / oneDay);
      const pharmacyRequestNo = `PHR${day}${requestNoFormat(
        new Date(),
        'yyHHMM'
      )}`;

      let pharmaObj = {
        pharmacyRequestNo,
        requestedBy: req.body.data.staffId,
        reconciliationNotes: [],
        generatedFrom: 'CareStream Request',
        item: {
          itemId: item._id,
          itemType: item.medClass.toLowerCase(),
          itemName: item.name,
          requestedQty: req.body.data.medications[i].requestedQty,
          priority: '',
          schedule: '',
          dosage: req.body.data.medications[i].dosage,
          frequency: req.body.data.medications[i].frequency,
          duration: req.body.data.medications[i].duration,
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
      { $set: { pharmacyRequest: pharmacyRequest } },
      { new: true }
    );
    Notification(
      'Medication',
      'Medication Of CareStream',
      'Nurses',
      'Pharmacist',
      '/dashboard/home/patientlist',
      req.body.edrId,
      '',
      'ED Nurse'
    );

    // Clinical Pharmacist
    Notification(
      'Reconciliation Request',
      'Care Stream Medication Request',
      'Clinical Pharmacist',
      '',
      '/dashboard/home/patientlist',
      req.body.edrId,
      '',
      ''
    );
  }

  const assignedCareStream = await EDR.findOneAndUpdate(
    { _id: req.body.data.edrId },
    { $push: { careStream } },
    { new: true }
  );

  const currentStaff = await Staff.findById(req.body.data.staffId).select(
    'staffType'
  );

  if (currentStaff.staffType === 'Paramedics') {
    Notification(
      'Patient Details',
      'Patient Details',
      'Sensei',
      'Paramedics',
      '/dashboard/home/pendingregistration',
      req.body.data.edrId,
      '',
      ''
    );
  }

  Notification(
    'careStream Assigned',
    'careStream Assigned',
    'Nurses',
    'CareStream',
    '/dashboard/home/patientlist',
    req.body.edrId,
    '',
    'ED Nurse'
  );

  Notification(
    'careStream Assigned',
    'Doctor assigned CareStream',
    'Doctor',
    'CareStream',
    '/dashboard/home/patientlist',
    req.body.edrId,
    '',
    'Rad Doctor'
  );

  res.status(200).json({
    success: true,
    data: assignedCareStream,
  });
});

exports.getInProgressCS = asyncHandler(async (req, res, next) => {
  const inProgressCS = await EDR.find({
    status: 'pending',
    'careStream.status': 'in_progress',
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
          // populate: [
          //   {
          //     path: 'rooms.roomId',
          //     model: 'room',
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
    data: inProgressCS,
  });
});

exports.completeCareStream = asyncHandler(async (req, res, next) => {
  const completedCS = await EDR.findOneAndUpdate(
    { _id: req.params.edrId, 'careStream._id': req.params.csId },
    { $set: { status: 'completed' } },
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: completedCS,
  });
});

exports.getPatientWithoutCSByKeyword = asyncHandler(async (req, res, next) => {
  const arr = [];
  const patients = await EDR.find({
    status: 'pending',
    careStream: { $eq: [] },
    room: { $ne: [] },
  }).populate('patientId ');

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

exports.getPatientsWithCSByKeyword = asyncHandler(async (req, res, next) => {
  const arr = [];
  const patients = await EDR.find({
    status: 'pending',
    // careStream: { $ne: [] },
    room: { $ne: [] },
  }).populate([
    {
      path: 'chiefComplaint.chiefComplaintId',
      model: 'chiefComplaint',

      populate: [
        {
          path: 'productionArea.productionAreaId',
          model: 'productionArea',
          // populate: [
          //   {
          //     path: 'rooms.roomId',
          //     model: 'room',
          //   },
          // ],
        },
      ],
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
      path: 'radRequest.serviceId',
      model: 'RadiologyService',
    },
    {
      path: 'labRequest.serviceId',
      model: 'LaboratoryService',
    },
  ]);

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

exports.getEDRswithCS = asyncHandler(async (req, res, next) => {
  const patients = await EDR.find({
    status: 'pending',
    // careStream: { $ne: [] },
    room: { $ne: [] },
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

  res.status(200).json({
    success: true,
    data: patients,
  });
});
