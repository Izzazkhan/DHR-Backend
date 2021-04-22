const base64ToImage = require('base64-to-image');
const moment = require('moment');
const QRCode = require('qrcode');
const requestNoFormat = require('dateformat');
const patientFHIR = require('../models/patient/patient');
const Room = require('../models/room');
const Notification = require('../components/notification');
const Flag = require('../models/flag/Flag');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const EDR = require('../models/EDR/EDR');
const generateReqNo = require('../components/requestNoGenerator');

exports.registerPatient = asyncHandler(async (req, res) => {
  let newPatient;
  const MRN = [
    {
      value: generateReqNo('KHMC'),
    },
  ];

  // newPatient = await patientFHIR.create(req.body);
  const parsed = JSON.parse(req.body.data);

  if (parsed.photo && parsed.photo.length > 0) {
    parsed.photo[0].url = req.files.file[0].path;
  } else {
    parsed.photo = null;
  }
  if (
    req.files.file ||
    req.files.front ||
    req.files.back ||
    req.files.insuranceCard
  ) {
    newPatient = await patientFHIR.create({
      identifier: MRN,
      nationalID: parsed.nationalID,
      name: parsed.name,
      gender: parsed.gender,
      birthDate: parsed.birthDate,
      age: parsed.age,
      height: parsed.height,
      weight: parsed.weight,
      telecom: parsed.telecom,
      address: parsed.address,
      country: parsed.country,
      city: parsed.city,
      nationality: parsed.nationality,
      blood: parsed.blood,
      photo: parsed.photo,
      idCardFront: req.files.front ? req.files.front[0].path : null,
      idCardBack: req.files.back ? req.files.back[0].path : null,
      otherDetails: parsed.otherDetails,
      contact: parsed.contact,
      paymentMethod: parsed.paymentMethod,
      insuranceNumber: parsed.insuranceNumber,
      insuranceVendor: parsed.insuranceVendor,
      coverageTerms: parsed.coverageTerms,
      coPayment: parsed.coPayment,
      coveredFamilyMember: parsed.coveredFamilyMember,
      coverageDetails: parsed.coverageDetails,
      insuranceDetails: parsed.insuranceDetails,
      insuranceCard: req.files.insuranceCard
        ? req.files.insuranceCard[0].path
        : null,
      processTime: parsed.time,
      registrationStatus: parsed.registrationStatus,
      // claimed,
      // status,
    });
  } else {
    newPatient = await patientFHIR.create({
      identifier: MRN,
      nationalID: parsed.nationalID,
      name: parsed.name,
      gender: parsed.gender,
      birthDate: parsed.birthDate,
      age: parsed.age,
      height: parsed.height,
      weight: parsed.weight,
      telecom: parsed.telecom,
      address: parsed.address,
      country: parsed.country,
      city: parsed.city,
      nationality: parsed.nationality,
      blood: parsed.blood,
      otherDetails: parsed.otherDetails,
      contact: parsed.contact,
      paymentMethod: parsed.paymentMethod,
      insuranceNumber: parsed.insuranceNumber,
      insuranceVendor: parsed.insuranceVendor,
      coverageTerms: parsed.coverageTerms,
      coPayment: parsed.coPayment,
      coveredFamilyMember: parsed.coveredFamilyMember,
      coverageDetails: parsed.coverageDetails,
      insuranceDetails: parsed.insuranceDetails,
      processTime: parsed.time,
      registrationStatus: parsed.registrationStatus,
      // claimed,
      // status,
    });
  }

  // Flag For Pending Registrations
  const patients = await patientFHIR.find({ registrationStatus: 'pending' });

  // Rasing Flag
  if (patients.length > 5) {
    await Flag.create({
      patientId: newPatient._id,
      generatedFrom: 'Registration Officer',
      card: '1st',
      generatedFor: ['Sensei', 'Registration Officer'],
      reason: 'Too Many Patients Registrations Pending',
      createdAt: Date.now(),
    });
    const flags = await Flag.find({
      generatedFrom: 'Registration Officer',
      status: 'pending',
    });
    globalVariable.io.emit('pendingRO', flags);
  }

  // Sensei Pending
  if (
    newPatient.processTime[newPatient.processTime.length - 1].processName ===
    'Sensei'
  ) {
    const pendingSensei = await patientFHIR.aggregate([
      {
        $project: {
          processTime: 1,
          registrationStatus: 1,
        },
      },
      {
        $unwind: '$processTime',
      },
      {
        $match: {
          $and: [
            { 'processTime.processName': 'Sensei' },
            { registrationStatus: 'pending' },
          ],
        },
      },
    ]);

    if (pendingSensei.length > 5) {
      await Flag.create({
        patientId: newPatient._id,
        generatedFrom: 'Registration Officer',
        card: '2nd',
        generatedFor: ['Sensei'],
        reason: 'Too Many Patients Registrations Pending after sensei',
        createdAt: Date.now(),
      });
      const flags = await Flag.find({
        generatedFrom: 'Registration Officer',
        status: 'pending',
      });
      globalVariable.io.emit('pendingRO', flags);
    }
  }
  if (
    newPatient.processTime[newPatient.processTime.length - 1].processName ===
    'Registration Officer'
  ) {
    // * Sending Notifications

    // Notification from RO to Sensei
    Notification(
      'ADT_A04',
      'Patient Details',
      'Sensei',
      'Registration Officer',
      '/dashboard/home/patientmanagement/patientregistration',
      '',
      newPatient._id,
      ''
    );

    Notification(
      'ADT_A04',
      'Patient Details from registration officer',
      'Cashier',
      'Registration Officer',
      '/dashboard/home/patientclearence/add',
      '',
      newPatient._id,
      ''
    );

    if (parsed.paymentMethod[0].payment === 'Insured') {
      Notification(
        'ADT_A04',
        'Registration officer add new patient',
        'Insurance Claims Manager',
        'New Patient',
        '/dashboard/home/completedregistration',
        '',
        newPatient._id,
        ''
      );
    }
  }

  const obj = {};
  obj.profileNo = newPatient.identifier[0].value;
  obj.createdAt = newPatient.createdAt;
  obj.insuranceCardNumber = newPatient.insuranceNumber;
  QRCode.toDataURL(JSON.stringify(obj), function (err, url) {
    const base64Str = url;
    const path = './uploads/';
    const pathFormed = base64ToImage(base64Str, path);
    patientFHIR
      .findOneAndUpdate(
        { _id: newPatient._id },
        { $set: { QR: '/uploads/' + pathFormed.fileName } },
        { new: true }
      )
      .then((docs) => {
        // console.log(docs);
        res.status(200).json({ success: true, data: docs });
      });
  });
});

exports.updatePatient = asyncHandler(async (req, res, next) => {
  const parsed = JSON.parse(req.body.data);
  let patient = await patientFHIR.findById(parsed._id);
  const edr = await EDR.findOne({ patientId: parsed._id });
  if (edr && edr.length > 0) {
    await EDR.findOneAndUpdate(
      { patientId: parsed._id },
      { $set: { paymentMethod: parsed.paymentMethod[0].payment } },
      { new: true }
    );
  }

  if (!patient) {
    return next(
      new ErrorResponse(`Patient not found with id of ${parsed._id}`, 404)
    );
  }
  let patientQR;
  // console.log(req.files);
  if (req.files) {
    patientQR = await patientFHIR.findOne({ _id: parsed._id });

    await patientFHIR.findOneAndUpdate(
      { _id: parsed._id },
      { $push: { processTime: parsed.time } },
      { new: true }
    );

    patient = await patientFHIR.findOneAndUpdate({ _id: parsed._id }, parsed, {
      new: true,
    });
    if (req.files.file) {
      patient = await patientFHIR.findOneAndUpdate(
        { _id: parsed._id },
        {
          $set: {
            'photo.0.url': req.files.file[0].path,
          },
        },
        {
          new: true,
        }
      );
    }
    if (req.files.front) {
      patient = await patientFHIR.findOneAndUpdate(
        { _id: parsed._id },
        {
          $set: {
            idCardFront: req.files.front[0].path,
          },
        },
        {
          new: true,
        }
      );
    }
    if (req.files.back) {
      patient = await patientFHIR.findOneAndUpdate(
        { _id: parsed._id },
        {
          $set: {
            idCardBack: req.files.back[0].path,
          },
        },
        {
          new: true,
        }
      );
    }
    if (req.files.insuranceCard) {
      patient = await patientFHIR.findOneAndUpdate(
        { _id: parsed._id },
        {
          $set: {
            insuranceCard: req.files.insuranceCard[0].path,
          },
        },
        {
          new: true,
        }
      );
    }
    // res.status(200).json({ success: true, data: patient });

    const patients = await patientFHIR.find({ registrationStatus: 'pending' });

    // Rasing Flag
    if (patients.length > 5) {
      await Flag.create({
        patientId: parsed._id,
        generatedFrom: 'Registration Officer',
        card: '1st',
        generatedFor: 'Sensei',
        reason: 'Too Many Patients Registrations Pending',
        createdAt: Date.now(),
      });
      const flags = await Flag.find({
        generatedFrom: 'Registration Officer',
        $or: [{ status: 'pending' }, { status: 'in_progress' }],
      });
      globalVariable.io.emit('pendingRO', flags);
    }

    if (
      patient.processTime[patient.processTime.length - 1].processName ===
      'Sensei'
    ) {
      const pendingSensei = await patientFHIR.aggregate([
        {
          $project: {
            processTime: 1,
            registrationStatus: 1,
          },
        },
        {
          $unwind: '$processTime',
        },
        {
          $match: {
            $and: [
              { 'processTime.processName': 'Sensei' },
              { registrationStatus: 'pending' },
            ],
          },
        },
      ]);

      if (pendingSensei.length > 5) {
        await Flag.create({
          patientId: parsed._id,
          generatedFrom: 'Registration Officer',
          card: '2nd',
          generatedFor: 'Sensei',
          reason: 'Too Many Patients Registrations Pending after sensei',
          createdAt: Date.now(),
        });
        const flags = await Flag.find({
          generatedFrom: 'Registration Officer',
          $or: [{ status: 'pending' }, { status: 'in_progress' }],

          // card: '1st',
        });
        globalVariable.io.emit('pendingRO', flags);
      }
    }

    // * Sending Notifications

    // Notification From Sensei
    if (
      patient.processTime[patient.processTime.length - 1].processName ===
      'Sensei'
    ) {
      Notification(
        'ADT_A04',
        'Details from Sensei',
        'Registration Officer',
        'Sensei',
        '/dashboard/home/patientregistration',
        // edr && edr.length > 0 && edr._id,
        '',
        patient._id,
        ''
      );
    }

    // Notification from Paramedics
    if (
      patient.processTime[patient.processTime.length - 1].processName ===
      'Paramedics'
    ) {
      Notification(
        'ADT_A04',
        'Details from Paramedics',
        'Registration Officer',
        'Paramedics',
        '/dashboard/home/pendingregistration',
        edr && edr.length > 0 && edr._id,
        ''
      );

      Notification(
        'ADT_A04',
        'Patient Details',
        'Sensei',
        'Paramedics',
        '/dashboard/home/patientmanagement/patientregistration',
        edr && edr.length > 0 && edr._id,
        ''
      );
    }

    // Notification from RO to Sensei
    if (
      patient.processTime[patient.processTime.length - 1].processName ===
      'Registration Officer'
    ) {
      Notification(
        'ADT_A04',
        'Patient Details',
        'Sensei',
        'Registration Officer',
        '/dashboard/home/patientmanagement/patientregistration',
        '',
        patient._id
      );
    }
    if (!patientQR.QR) {
      const obj = {};
      obj.profileNo = patient.identifier[0].value;
      obj.createdAt = patient.createdAt;
      obj.insuranceCardNumber = patient.insuranceNumber;
      QRCode.toDataURL(JSON.stringify(obj), function (err, url) {
        const base64Str = url;
        const path = './uploads/';
        const pathFormed = base64ToImage(base64Str, path);
        // console.log(pathFormed);
        patientFHIR
          .findOneAndUpdate(
            { _id: patient._id },
            { $set: { QR: '/uploads/' + pathFormed.fileName } },
            { new: true }
          )
          .then((docs) => {
            // console.log(docs);
            res.status(200).json({ success: true, data: docs });
          });
      });
    } else {
      res.status(200).json({ success: true, data: patient });
    }
  } else {
    patientQR = await patientFHIR.findOne({ _id: parsed._id });
    await patientFHIR.findOneAndUpdate(
      { _id: parsed._id },
      { $push: { processTime: parsed.time } },
      { new: true }
    );
    patient = await patientFHIR.findOneAndUpdate({ _id: parsed._id }, parsed, {
      new: true,
    });

    const patients = await patientFHIR.find({ registrationStatus: 'pending' });

    // Rasing Flag
    if (patients.length > 5) {
      await Flag.create({
        patientId: parsed._id,
        generatedFrom: 'Registration Officer',
        card: '1st',
        generatedFor: 'Sensei',
        reason: 'Too Many Patients Registrations Pending',
        createdAt: Date.now(),
      });
      const flags = await Flag.find({
        generatedFrom: 'Registration Officer',
        $or: [{ status: 'pending' }, { status: 'in_progress' }],

        // card: '1st',
      });
      globalVariable.io.emit('pendingRO', flags);
    }

    if (
      patient.processTime[patient.processTime.length - 1].processName ===
      'Sensei'
    ) {
      const pendingSensei = await patientFHIR.aggregate([
        {
          $project: {
            processTime: 1,
            registrationStatus: 1,
          },
        },
        {
          $unwind: '$processTime',
        },
        {
          $match: {
            $and: [
              { 'processTime.processName': 'Sensei' },
              { registrationStatus: 'pending' },
            ],
          },
        },
      ]);

      if (pendingSensei.length > 5) {
        await Flag.create({
          patientId: parsed._id,
          generatedFrom: 'Registration Officer',
          card: '2nd',
          generatedFor: 'Sensei',
          reason: 'Too Many Patients Registrations Pending after sensei',
          createdAt: Date.now(),
        });
        const flags = await Flag.find({
          generatedFrom: 'Registration Officer',
          $or: [{ status: 'pending' }, { status: 'in_progress' }],

          // card: '1st',
        });
        globalVariable.io.emit('pendingRO', flags);
      }
    }

    // * Sending Notifications

    // Notification From Sensei
    if (
      patient.processTime[patient.processTime.length - 1].processName ===
      'Sensei'
    ) {
      Notification(
        'ADT_A04',
        'Details from Sensei',
        'Registration Officer',
        '/dashboard/home/patientregistration',
        '',
        patient._id,
        ''
      );
    }

    // Notification from Paramedics
    if (
      patient.processTime[patient.processTime.length - 1].processName ===
      'Paramedics'
    ) {
      Notification(
        'ADT_A04',
        'Details from Paramedics',
        'Registration Officer',
        '/dashboard/home/pendingregistration',
        '',
        patient._id,
        ''
      );

      Notification(
        'ADT_A04',
        'Patient Details',
        'Sensei',
        '/dashboard/home/patientmanagement/patientregistration',
        '',
        patient._id
      );
    }

    // Notification from RO to Sensei
    if (
      patient.processTime[patient.processTime.length - 1].processName ===
      'Registration Officer'
    ) {
      Notification(
        'ADT_A04',
        'Patient Details',
        'Sensei',
        'Registration Officer',
        '/dashboard/home/patientmanagement/patientregistration',
        '',
        patient._id
      );
    }
    if (!patientQR.QR) {
      const obj = {};
      obj.profileNo = patient.identifier[0].value;
      obj.createdAt = patient.createdAt;
      obj.insuranceCardNumber = patient.insuranceNumber;

      QRCode.toDataURL(JSON.stringify(obj), function (err, url) {
        const base64Str = url;
        const path = './uploads/';
        const pathFormed = base64ToImage(base64Str, path);

        patientFHIR
          .findOneAndUpdate(
            { _id: patient._id },
            { $set: { QR: '/uploads/' + pathFormed.fileName } },
            { new: true }
          )
          .then((docs) => {
            // console.log(docs);
            res.status(200).json({ success: true, data: docs });
          });
      });
    } else {
      res.status(200).json({ success: true, data: patient });
    }
    // res.status(200).json({ success: true, data: patient });
  }
});

exports.getPatient = asyncHandler(async (req, res, next) => {
  // console.log(req.params.patientId);
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
  const patients = await patientFHIR.find();
  // console.log(patients);
  res.status(200).json({
    success: true,
    data: patients,
  });
});

exports.getInsuredPatients = asyncHandler(async (req, res) => {
  const patients = await patientFHIR.find({
    'paymentMethod.payment': 'Insured',
  });

  res.status(200).json({
    success: true,
    data: patients,
  });
});

exports.searchInsuredPatient = asyncHandler(async (req, res, next) => {
  const patients = await patientFHIR.find({
    'paymentMethod.payment': 'Insured',
  });

  const arr = [];
  for (let i = 0; i < patients.length; i++) {
    const fullName =
      patients[i].name[0].given[0] + ' ' + patients[i].name[0].family;
    if (
      (patients[i].name[0].given[0] &&
        patients[i].name[0].given[0]
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].name[0].family &&
        patients[i].name[0].family
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].identifier[0].value &&
        patients[i].identifier[0].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      fullName.toLowerCase().startsWith(req.params.keyword.toLowerCase()) ||
      (patients[i].telecom[1].value &&
        patients[i].telecom[1].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].nationalID &&
        patients[i].nationalID
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

exports.getPendingRegistration = asyncHandler(async (req, res, next) => {
  const pendingPatients = await patientFHIR.find({
    registrationStatus: 'pending',
  });
  res.status(200).json({
    count: pendingPatients.length,
    success: true,
    data: pendingPatients,
  });
});

exports.getCompletedRegistration = asyncHandler(async (req, res, next) => {
  const approvedPatients = await patientFHIR.find({
    registrationStatus: 'completed',
  });
  res.status(200).json({
    success: true,
    data: approvedPatients,
  });
});

exports.getApprovedPatientById = asyncHandler(async (req, res, next) => {
  const patient = await patientFHIR.findOne({
    _id: req.params.patientId,
    status: 'completed',
  });

  if (!patient) {
    return next(new ErrorResponse('No patient found with this id', 404));
  }

  res.status(200).json({
    success: true,
    data: patient,
  });
});

exports.getApprovedPatientByKeyword = asyncHandler(async (req, res, next) => {
  const patients = await patientFHIR.find({ registrationStatus: 'completed' });
  // const arr = searchPatient(patients);
  const arr = [];
  for (let i = 0; i < patients.length; i++) {
    const fullName =
      patients[i].name[0].given[0] + ' ' + patients[i].name[0].family;
    if (
      (patients[i].name[0].given[0] &&
        patients[i].name[0].given[0]
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].name[0].family &&
        patients[i].name[0].family
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].identifier[0].value &&
        patients[i].identifier[0].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      fullName.toLowerCase().startsWith(req.params.keyword.toLowerCase()) ||
      (patients[i].telecom[1].value &&
        patients[i].telecom[1].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].nationalID &&
        patients[i].nationalID
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

exports.getPendingPatientByKeyword = asyncHandler(async (req, res, next) => {
  const patients = await patientFHIR.find({ registrationStatus: 'pending' });

  const arr = [];
  for (let i = 0; i < patients.length; i++) {
    const fullName =
      patients[i].name[0].given[0] + ' ' + patients[i].name[0].family;
    if (
      (patients[i].name[0].given[0] &&
        patients[i].name[0].given[0]
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].name[0].family &&
        patients[i].name[0].family
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].identifier[0].value &&
        patients[i].identifier[0].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      fullName.toLowerCase().startsWith(req.params.keyword.toLowerCase()) ||
      (patients[i].telecom[1].value &&
        patients[i].telecom[1].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].nationalID &&
        patients[i].nationalID
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

exports.getPatientByKeyword = asyncHandler(async (req, res, next) => {
  const patient = await patientFHIR
    .aggregate([
      {
        $match: {
          $or: [
            {
              'name.given': { $regex: req.params.keyword, $options: 'i' },
            },
            {
              'name.family': { $regex: req.params.keyword, $options: 'i' },
            },
            {
              'identifier.value': { $regex: req.params.keyword, $options: 'i' },
            },
            { nationalID: { $regex: req.params.keyword, $options: 'i' } },
            {
              'telecom.value': {
                $regex: req.params.keyword,
                $options: 'i',
              },
            },
          ],
        },
      },
    ])
    .limit(50);
  if (!patient) {
    return next(new ErrorResponse('No Data Found With this keyword', 404));
  }

  res.status(200).json({
    success: true,
    data: patient,
  });
});
