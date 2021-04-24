const requestNoFormat = require('dateformat');
const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const CCRequest = require('../models/customerCareRequest');
const Staff = require('../models/staffFhir/staff');
const Notification = require('../components/notification');
const Flag = require('../models/flag/Flag');
const searchStaff = require('../components/searchStaff');
const searchEdrPatient = require('../components/searchEdr');
const generateReqNo = require('../components/requestNoGenerator');

exports.paramedicsEdr = asyncHandler(async (req, res, next) => {
  const paramedicsEdr = await EDR.find({
    generatedFrom: 'Paramedics',
    patientInHospital: false,
  })
    .populate('patientId', 'identifier name age gender telecom createdAt')
    .select('patientId careStream');
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
  if (request && request.length > 0) {
    return next(
      new ErrorResponse('A request is already generated for this Edr', 400)
    );
  }

  // Customer Care Request

  const currentStaff = await Staff.findById(req.body.staffId).select('shift');

  const CCRequestNo = generateReqNo('ARID');
  const customerCares = await Staff.find({
    staffType: 'Customer Care',
    disabled: false,
    shift: currentStaff.shift,
  }).select('shift');

  const randomCC = Math.floor(Math.random() * (customerCares.length - 1));

  const customerCare = customerCares[randomCC];

  const cc = await CCRequest.create({
    requestNo: CCRequestNo,
    edrId: req.body.edrId,
    status: 'pending',
    staffId: req.body.staffId,
    requestedFor: 'Transfer',
    requestedAt: Date.now(),
    costomerCareId: customerCare._id,
  });

  const requests = await CCRequest.find({
    requestedFor: 'Transfer',
    status: 'pending',
  });
  if (requests.length > 4) {
    await Flag.create({
      edrId: req.body.edrId,
      generatedFrom: 'Customer Care',
      card: '2nd',
      generatedFor: ['Customer Care Director'],
      reason: 'Patient Transfer from Ambulance to Bed Pending',
      createdAt: Date.now(),
    });
    const flags = await Flag.find({
      generatedFrom: 'Customer Care',
      status: 'pending',
    });
    globalVariable.io.emit('ccPending', flags);
  }

  Notification(
    'ADT_A15',
    'Carry the Patient from Ambulance to ED Cell',
    'Customer Care',
    'Ambulance Request',
    '/dashboard/home/taskslistforcustomercare',
    req.body.edrId,
    ''
  );
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
  const patients = await EDR.find({
    patientInHospital: false,
    generatedFrom: 'Paramedics',
  })
    .select('patientId dcdFormStatus')
    .populate(
      'patientId',
      'name identifier telecom nationalID gender age createdAt'
    );

  const arr = searchEdrPatient(req, patients);

  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.searchCompletedPMEdr = asyncHandler(async (req, res, next) => {
  const patients = await EDR.find({
    patientInHospital: true,
    generatedFrom: 'Paramedics',
  })
    .select('patientId dcdFormStatus')
    .populate(
      'patientId',
      'name identifier telecom nationalID gender age createdAt'
    );

  const arr = searchEdrPatient(req, patients);

  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.searchPMEdr = asyncHandler(async (req, res, next) => {
  const patients = await EDR.find({
    generatedFrom: 'Paramedics',
  })
    .select('patientId requestNo')
    .populate(
      'patientId',
      'name identifier telecom nationalID gender age createdAt'
    );

  const arr = searchEdrPatient(req, patients);

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

    const arr = searchStaff(req, staff);
    res.status(200).json({
      success: true,
      data: arr,
    });
  }
);
