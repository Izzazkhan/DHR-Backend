const requestNoFormat = require('dateformat');
const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const CCRequest = require('../models/customerCareRequest');
const Staff = require('../models/staffFhir/staff');

exports.paramedicsEdr = asyncHandler(async (req, res, next) => {
  const paramedicsEdr = await EDR.find({
    generatedFrom: 'Paramedics',
    patientInHospital: false,
  })
    .populate('patientId', 'identifier name age gender telecom createdAt')
    .select('patientId');
  res.status(200).json({
    success: true,
    data: paramedicsEdr,
  });
});

exports.edrFromParamedics = asyncHandler(async (req, res, next) => {
  const paramedicsEdr = await EDR.find({
    generatedFrom: 'Paramedics',
  })
    .populate('patientId')
    .select('patientId requestNo');
  res.status(200).json({
    success: true,
    data: paramedicsEdr,
  });
});

exports.edrTransfer = asyncHandler(async (req, res, next) => {
  const request = await CCRequest.find({
    edrId: req.body.edrId,
    requestedFor: 'Transfer',
  });
  // console.log(request);
  if (request && request.length > 0) {
    return next(
      new ErrorResponse('A request is already generated for this Edr', 400)
    );
  }
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff =
    now -
    start +
    (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  // const requestNo = '' + day + requestNoFormat(new Date(), 'yyHHMMss');

  // Customer Care Request
  let startTimeCC;
  let endTimeCC;
  let currentTimeCC = new Date();

  currentTimeCC = currentTimeCC.toISOString().split('T')[1];
  // console.log(currentTimeCC);

  const CCrequestNo = 'ARID' + day + requestNoFormat(new Date(), 'yyHHMMss');
  const customerCares = await Staff.find({
    staffType: 'Customer Care',
    disabled: false,
    // availability: true,
  }).select('identifier name shiftStartTime shiftEndTime');
  const shiftCC = customerCares.filter((CC) => {
    startTimeCC = CC.shiftStartTime.toISOString().split('T')[1];
    endTimeCC = CC.shiftEndTime.toISOString().split('T')[1];
    if (currentTimeCC >= startTimeCC && currentTimeCC <= endTimeCC) {
      console.log(CC);
      return CC;
    }
  });

  const randomCC = Math.floor(Math.random() * (shiftCC.length - 1));
  // console.log(randomCC);
  const customerCare = shiftCC[randomCC];

  const cc = await CCRequest.create({
    requestNo: CCrequestNo,
    edrId: req.body.edrId,
    status: 'pending',
    staffId: req.body.staffId,
    requestedFor: 'Transfer',
    requestedAt: Date.now(),
    customerCareId: customerCare._id,
  });
  res.status(200).json({
    success: true,
    data: cc,
  });
});

exports.transferredParamedicsEdr = asyncHandler(async (req, res, next) => {
  const paramedicsEdr = await EDR.find({
    generatedFrom: 'Paramedics',
    patientInHospital: true,
  })
    .populate('patientId', 'identifier name age gender telecom createdAt')
    .select('patientId');
  res.status(200).json({
    success: true,
    data: paramedicsEdr,
  });
});

exports.searchPendingPMEdr = asyncHandler(async (req, res, next) => {
  const arr = [];
  const patients = await EDR.find({
    patientInHospital: false,
    generatedFrom: 'Paramedics',
  })
    .select('patientId dcdFormStatus')
    .populate(
      'patientId',
      'name identifier telecom nationalID gender age createdAt'
    );

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
      //  break;
    }
  }

  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.searchCompletedPMEdr = asyncHandler(async (req, res, next) => {
  const arr = [];
  const patients = await EDR.find({
    patientInHospital: true,
    generatedFrom: 'Paramedics',
  })
    .select('patientId dcdFormStatus')
    .populate(
      'patientId',
      'name identifier telecom nationalID gender age createdAt'
    );

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
      //  break;
    }
  }

  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.searchPMEdr = asyncHandler(async (req, res, next) => {
  const arr = [];
  const patients = await EDR.find({
    generatedFrom: 'Paramedics',
  })
    .select('patientId requestNo')
    .populate(
      'patientId',
      'name identifier telecom nationalID gender age createdAt'
    );

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
      //  break;
    }
  }

  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.criticalCasesPerParamedics = asyncHandler(async (req, res, next) => {
  const paramedicsEdr = await EDR.find({
    generatedFrom: 'Paramedics',
    generatedBy: { $exists: true },
  });

  const staff = await Staff.find({ staffType: 'Paramedics' }).populate(
    'addedBy'
  );
  let resWithCount = [];
  for (let i = 0; i < staff.length; i++) {
    let casesHandled = 0;
    for (let j = 0; j < paramedicsEdr.length; j++) {
      if (staff[i]._id.toString() == paramedicsEdr[j].generatedBy.toString()) {
        casesHandled++;
      }
    }
    let obj = JSON.parse(JSON.stringify(staff[i]));
    obj.casesHandled = casesHandled;
    resWithCount.push(obj);
  }
  res.status(200).json({
    success: true,
    data: resWithCount,
  });
});

exports.searchParamedicsByCriricalCases = asyncHandler(
  async (req, res, next) => {
    const arr = [];
    const paramedicsEdr = await EDR.find({
      generatedFrom: 'Paramedics',
      generatedBy: { $exists: true },
    });

    const s = await Staff.find({ staffType: 'Paramedics' }).populate('addedBy');
    let staff = [];
    for (let i = 0; i < s.length; i++) {
      let casesHandled = 0;
      for (let j = 0; j < paramedicsEdr.length; j++) {
        if (s[i]._id.toString() == paramedicsEdr[j].generatedBy.toString()) {
          casesHandled++;
        }
      }
      let obj = JSON.parse(JSON.stringify(s[i]));
      obj.casesHandled = casesHandled;
      staff.push(obj);
    }

    for (let i = 0; i < staff.length; i++) {
      const fullName =
        staff[i].name[0].given[0] + ' ' + staff[i].name[0].family;
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
  }
);
