// const generatePassword = require('password-generator');
// const nodemailer = require('nodemailer');
const Staff = require('../models/staffFhir/staff');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const EDR = require('../models/EDR/EDR');
const searchStaff = require('../components/searchStaff');
const generateReqNo = require('../components/requestNoGenerator');

// register a staff
exports.registerStaff = asyncHandler(async (req, res, next) => {
  const parsed = JSON.parse(req.body.data);

  let profileId;
  switch (parsed.staffType) {
    case 'Doctor':
      profileId = generateReqNo('Dr');
      break;
    case 'Sensei':
      profileId = generateReqNo('Se');
      break;
    case 'Nurse':
      profileId = generateReqNo('Nu');
      break;
    case 'Clinical Pharmacist':
      profileId = generateReqNo('CP');
      break;
    case 'Registration Officer':
      profileId = generateReqNo('RO');
      break;
    case 'Paramedics':
      profileId = generateReqNo('PM');
      break;
    case 'Customer Care':
      profileId = generateReqNo('CC');
      break;
    case 'Housekeeping':
      profileId = generateReqNo('HK');
      break;
    case 'Social Worker':
      profileId = generateReqNo('SW');
      break;
    case 'Imaging Technician':
      profileId = generateReqNo('IT');
      break;
    case 'Lab Technician':
      profileId = generateReqNo('LT');
      break;
    case 'Cashier':
      profileId = generateReqNo('Ca');
      break;
    case 'Insurance Claims Manager':
      profileId = generateReqNo('ICM');
      break;
    default:
      profileId = generateReqNo('St');
  }
  const staffId = [
    {
      value: profileId,
    },
  ];

  if (req.file) {
    parsed.photo[0].url = req.file.path;
    const staff = await Staff.create({
      identifier: staffId,
      name: parsed.name,
      gender: parsed.gender,
      birthDate: parsed.birthDate,
      age: parsed.age,
      telecom: parsed.telecom,
      address: parsed.address,
      country: parsed.country,
      city: parsed.city,
      staffType: parsed.staffType,
      subType: parsed.subType,
      nationality: parsed.nationality,
      photo: parsed.photo,
      specialty: parsed.specialty,
      communication: parsed.communication,
      education: parsed.education,
      experience: parsed.experience,
      email: parsed.email,
      password: parsed.password,
      addedBy: parsed.addedBy,
      shift: parsed.shift,
      additionalRole: parsed.additionalRole,
    });
    res.status(201).json({
      success: true,
      data: staff,
    });
  } else {
    const staff = await Staff.create({
      identifier: staffId,
      name: parsed.name,
      gender: parsed.gender,
      birthDate: parsed.birthDate,
      age: parsed.age,
      telecom: parsed.telecom,
      address: parsed.address,
      country: parsed.country,
      staffType: parsed.staffType,
      subType: parsed.subType,
      city: parsed.city,
      nationality: parsed.nationality,
      specialty: parsed.specialty,
      communication: parsed.communication,
      education: parsed.education,
      experience: parsed.experience,
      email: parsed.email,
      password: parsed.password,
      addedBy: parsed.addedBy,
      shift: parsed.shift,
      additionalRole: parsed.additionalRole,
    });
    res.status(201).json({
      success: true,
      data: staff,
    });
  }
});

exports.getAllStaff = asyncHandler(async (req, res, next) => {
  const staff = await Staff.find()
    .populate('addedBy shift')
    .populate([
      {
        path: 'chiefComplaint.chiefComplaintId',
        model: 'chiefComplaint',
        // select: 'chiefComplaint.chiefComplaintId',
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
    data: staff,
  });
});

exports.getStaffById = asyncHandler(async (req, res, next) => {
  const staff = await Staff.findById(req.params.staffId);

  res.status(200).json({
    success: true,
    data: staff,
  });
});

exports.getEDDoctors = asyncHandler(async (req, res, next) => {
  const staff = await Staff.find({ staffType: 'Doctor' })
    .populate('addedBy shift')
    .populate('chiefComplaint.chiefComplaintId');
  res.status(200).json({
    success: true,
    data: staff,
  });
});

exports.disableStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.findOne({ _id: req.params.id });
  if (staff.availability === false) {
    res
      .status(200)
      .json({ success: false, data: 'staff not available for disabling' });
  } else if (staff.disabled === true) {
    res.status(200).json({ success: false, data: 'Staff already disabled' });
  } else {
    const updateRecord = {
      updatedAt: Date.now(),
      updatedBy: req.body.staffId,
      reason: req.body.reason,
    };
    await Staff.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: { disabled: true },
        $push: { updateRecord: updateRecord },
      }
    );
    res
      .status(200)
      .json({ success: true, data: 'Staff status changed to disable' });
  }
});

exports.enableStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.findOne({ _id: req.params.id });
  if (staff.disabled === true) {
    const updateRecord = {
      updatedAt: Date.now(),
      updatedBy: req.body.staffId,
      reason: req.body.reason,
    };
    await Staff.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: { disabled: false },
        $push: { updateRecord: updateRecord },
      }
    );
    res
      .status(200)
      .json({ success: true, data: 'Staff status changed to enable' });
  } else {
    res.status(200).json({ success: false, data: 'Staff already enabled' });
  }
});

exports.updateStaff = asyncHandler(async (req, res, next) => {
  const parsed = JSON.parse(req.body.data);
  let staff = await Staff.findById(parsed._id);
  if (!staff) {
    return next(
      new ErrorResponse(`staff not found with id of ${parsed._id}`, 404)
    );
  }

  if (req.file) {
    parsed.photo[0].url = req.file.path;
    staff = await Staff.findOneAndUpdate({ _id: parsed._id }, parsed, {
      new: true,
    });
    res.status(200).json({ success: true, data: staff });
  } else {
    staff = await Staff.findOneAndUpdate({ _id: parsed._id }, parsed, {
      new: true,
    });
    res.status(200).json({ success: true, data: staff });
  }
});

exports.getDoctorSubTypes = asyncHandler(async (req, res, next) => {
  const subtypes = [
    'Internal',
    'External',
    'Anesthesiologist',
    'ED Doctor',
    'Rad Doctor',
  ];
  res.status(200).json({
    success: true,
    data: subtypes,
  });
});

exports.getNurseSubTypes = asyncHandler(async (req, res, next) => {
  const subtypes = ['ED Nurse', 'EOU Nurse', 'Nurse Technician'];
  res.status(200).json({
    success: true,
    data: subtypes,
  });
});

exports.getDoctorSpecialty = asyncHandler(async (req, res, next) => {
  const specialties = [
    'Eye Specialist',
    'Skin Specialist',
    'Ent Specialist',
    'Dentist',
    'Dermatologists',
  ];
  res.status(200).json({
    success: true,
    data: specialties,
  });
});

exports.getNurseSpecialty = asyncHandler(async (req, res, next) => {
  const specialties = [
    'General Nurse',
    'Clinical Nurse',
    'Psychiatric Nurse',
    'Criritcal Care Nurse',
    'Nursing Administrator',
  ];
  res.status(200).json({
    success: true,
    data: specialties,
  });
});

exports.getAllSensei = asyncHandler(async (req, res) => {
  const sensei = await Staff.find({
    staffType: 'Sensei',
    disabled: false,
  })
    .populate('addedBy shift')
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
    ]);
  res.status(200).json({ success: 'true', data: sensei });
});

exports.getAllParamedics = asyncHandler(async (req, res) => {
  const paramedics = await Staff.find({
    staffType: 'Paramedics',
    disabled: false,
  }).populate('addedBy');
  res.status(200).json({ success: 'true', data: paramedics });
});

exports.getAllDoctors = asyncHandler(async (req, res) => {
  const doctors = await Staff.find({
    staffType: 'Doctor',
    disabled: false,
    // availability: true,
  }).populate('addedBy productionArea.productionAreaId');
  res.status(200).json({ success: 'true', data: doctors });
});

exports.searchDoctor = asyncHandler(async (req, res, next) => {
  const staff = await Staff.find({ staffType: 'Doctor', disabled: false });

  const arr = searchStaff(req, staff);

  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.searchSensei = asyncHandler(async (req, res, next) => {
  const staff = await Staff.find({
    staffType: 'Sensei',
    disabled: false,
  })
    .populate('addedBy shift')
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
    ]);

  const arr = searchStaff(req, staff);

  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.searchParamedics = asyncHandler(async (req, res, next) => {
  const staff = await Staff.find({
    staffType: 'Paramedics',
    disabled: false,
  }).populate('addedBy');

  const arr = searchStaff(req, staff);

  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.getSpecialityDoctor = asyncHandler(async (req, res, next) => {
  const currentStaff = await Staff.findById(req.params.staffId).select('shift');
  const doctors = await Staff.find({
    staffType: 'Doctor',
    specialty: req.params.speciality,
    $or: [{ subType: 'Internal' }, { subType: 'External' }],
    disabled: false,
    shift: currentStaff.shift,
  });
  // console.log(doctors);
  res.status(200).json({
    success: true,
    data: doctors,
  });
});

exports.getAnesthesiologist = asyncHandler(async (req, res, next) => {
  const anesthesiologist = await Staff.find({
    staffType: 'Doctor',
    subType: 'Anesthesiologist',
    disabled: false,
    // availability: true,
  })
    .populate('shift')
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
    ]);

  res.status(200).json({
    success: true,
    data: anesthesiologist,
  });
});

exports.searchAnesthesiologist = asyncHandler(async (req, res, next) => {
  const staff = await Staff.find({
    staffType: 'Doctor',
    subType: 'Anesthesiologist',
    disabled: false,
  }).populate('shift');

  const arr = searchStaff(req, staff);

  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.getSpecialityNurse = asyncHandler(async (req, res, next) => {
  const currentStaff = await Staff.findById(req.params.staffId).select('shift');

  const nurses = await Staff.find({
    staffType: 'Nurses',
    specialty: req.params.speciality,
    subType: 'ED Nurse',
    disabled: false,
    shift: currentStaff.shift,
  });

  res.status(200).json({
    success: true,
    data: nurses,
  });
});

exports.getEOUNurse = asyncHandler(async (req, res, next) => {
  const currentStaff = await Staff.findById(req.params.staffId).select('shift');

  const nurses = await Staff.find({
    staffType: 'Nurses',
    specialty: req.params.speciality,
    subType: 'EOU Nurse',
    disabled: false,
    shift: currentStaff.shift,
  });

  res.status(200).json({
    success: true,
    data: nurses,
  });
});

exports.getAllEOUNurses = asyncHandler(async (req, res, next) => {
  const currentStaff = await Staff.findById(req.params.staffId).select('shift');
  const nurses = await Staff.find({
    staffType: 'Nurses',
    subType: 'EOU Nurse',
    disabled: false,
    shift: currentStaff.shift,
    // availability: true,
  })
    .select('identifier name specialty chiefComplaint')
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
    ]);

  res.status(200).json({
    success: true,
    data: nurses,
  });
});

exports.searchEouNurses = asyncHandler(async (req, res, next) => {
  const staff = await Staff.find({
    staffType: 'Nurses',
    subType: 'EOU Nurse',
    disabled: false,
    // availability: true,
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
  ]);

  const arr = searchStaff(req, staff);

  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.getNurseTechnician = asyncHandler(async (req, res, next) => {
  const currentStaff = await Staff.findById(req.params.staffId).select('shift');
  const nurses = await Staff.find({
    staffType: 'Nurses',
    specialty: req.params.speciality,
    subType: 'Nurse Technician',
    disabled: false,
    shift: currentStaff.shift,
  });
  res.status(200).json({
    success: true,
    data: nurses,
  });
});

exports.getLabTechnician = asyncHandler(async (req, res, next) => {
  const currentStaff = await Staff.findById(req.params.staffId).select('shift');
  const nurses = await Staff.find({
    staffType: 'Lab Technician',
    disabled: false,
    shift: currentStaff.shift,
  });
  res.status(200).json({
    success: true,
    data: nurses,
  });
});

exports.getRadTechnician = asyncHandler(async (req, res, next) => {
  const currentStaff = await Staff.findById(req.params.staffId).select('shift');
  const nurses = await Staff.find({
    staffType: 'Imaging Technician',
    disabled: false,
    shift: currentStaff.shift,
  });
  res.status(200).json({
    success: true,
    data: nurses,
  });
});

exports.getAllHouseKeepers = asyncHandler(async (req, res, next) => {
  const houseKeepers = await Staff.find({
    staffType: 'House Keeping',
    disabled: false,
    // availability: true,
  }).select('identifier name');
  res.status(200).json({
    success: true,
    data: houseKeepers,
  });
});

exports.getCustomerCares = asyncHandler(async (req, res, next) => {
  const houseKeepers = await Staff.find({
    staffType: 'Customer Care',
    disabled: false,
    // availability: true,
  })
    .select('identifier name chiefComplaint shift')
    .populate('shift')
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
    ]);
  res.status(200).json({
    success: true,
    data: houseKeepers,
  });
});

exports.searchCustomerCare = asyncHandler(async (req, res, next) => {
  const staff = await Staff.find({
    staffType: 'Customer Care',
    disabled: false,
    // availability: true,
  });

  const arr = searchStaff(req, staff);

  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.getNurseTechnicians = asyncHandler(async (req, res, next) => {
  const nurses = await Staff.find({
    staffType: 'Nurses',
    subType: 'Nurse Technician',
    disabled: false,
  }).select('identifier name');
  res.status(200).json({
    success: true,
    data: nurses,
  });
});

exports.searchEdNurse = asyncHandler(async (req, res, next) => {
  const staff = await Staff.find({
    staffType: 'Nurses',
    subType: 'ED Nurse',
    disabled: false,
  });

  const arr = searchStaff(req, staff);

  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.getExternal = asyncHandler(async (req, res, next) => {
  const externals = await Staff.find({
    subType: 'External',
    disabled: false,
  })
    .select('identifier name specialty chiefComplaint experience')
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
    ]);
  res.status(200).json({
    success: true,
    data: externals,
  });
});

exports.getEDNurses = asyncHandler(async (req, res, next) => {
  const nurses = await Staff.find({
    staffType: 'Nurses',
    subType: 'ED Nurse',
    disabled: false,
  }).populate('shift');
  res.status(200).json({
    success: true,
    data: nurses,
  });
});

exports.searchExternalConsultant = asyncHandler(async (req, res, next) => {
  const staff = await Staff.find({
    subType: 'External',
    disabled: false,
  })
    .select(
      'identifier name specialty chiefComplaint experience telecom nationalID'
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
    ]);

  const arr = searchStaff(req, staff);

  res.status(200).json({
    success: true,
    data: arr,
  });
});

// External Consultant Cases
exports.externalCC = asyncHandler(async (req, res, next) => {
  const cases = await EDR.aggregate([
    {
      $project: {
        consultationNote: 1,
        chiefComplaint: 1,
        id: 1,
      },
    },
    {
      $unwind: '$consultationNote',
    },
    {
      $match: {
        'consultationNote.consultationType': 'External',
      },
    },
  ]);

  const consulatations = await EDR.populate(cases, [
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
      path: 'consultationNote.consultant',
      model: 'staff',
      select: 'identifier name speciality',
    },
  ]);

  res.status(200).json({
    success: true,
    data: consulatations,
  });
});

exports.searchExternalCC = asyncHandler(async (req, res, next) => {
  const cases = await EDR.aggregate([
    {
      $project: {
        consultationNote: 1,
        chiefComplaint: 1,
        id: 1,
      },
    },
    {
      $unwind: '$consultationNote',
    },
    {
      $match: {
        'consultationNote.consultationType': 'External',
      },
    },
  ]);

  const staff = await EDR.populate(cases, [
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
      path: 'consultationNote.consultant',
      model: 'staff',
      select: 'identifier name speciality',
    },
  ]);

  const arr = [];
  for (let i = 0; i < staff.length; i++) {
    const fullName =
      staff[i].consultationNote.consultant.name[0].given[0] +
      ' ' +
      staff[i].consultationNote.consultant.name[0].family;
    if (
      (staff[i].consultationNote.consultant.name[0].given[0] &&
        staff[i].consultationNote.consultant.name[0].given[0]
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (staff[i].consultationNote.consultant.name[0].family &&
        staff[i].consultationNote.consultant.name[0].family
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (staff[i].consultationNote.consultant.identifier[0].value &&
        staff[i].consultationNote.consultant.identifier[0].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      fullName.toLowerCase().startsWith(req.params.keyword.toLowerCase())
    ) {
      arr.push(staff[i]);
    }
  }

  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.getAllNurses = asyncHandler(async (req, res, next) => {
  const nurses = await Staff.find({ staffType: 'Nurses', disabled: false });
  res.status(200).json({
    success: true,
    data: nurses,
  });
});

exports.radTestStats = asyncHandler(async (req, res, next) => {
  const rads = await EDR.aggregate([
    {
      $project: {
        radRequest: 1,
      },
    },
    {
      $unwind: '$radRequest',
    },
    {
      $match: { 'radRequest.status': 'completed' },
    },
    {
      $group: {
        _id: 'radRequest',
        radRequest: { $push: '$radRequest' },
      },
    },
  ]);
  const radDoctors = await Staff.find({ staffType: 'Imaging Technician' })
    .select('identifier name chiefComplaint shift')
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
    ]);
  const newArray = [];

  for (let i = 0; i < radDoctors.length; i++) {
    const obj = JSON.parse(JSON.stringify(radDoctors[i]));
    let count = 0;
    const countWithTest = {};
    const radRequest = [];
    for (let j = 0; j < rads[0].radRequest.length; j++) {
      if (
        radDoctors[i]._id.toString() ===
        rads[0].radRequest[j].imageTechnicianId.toString()
      ) {
        // obj.radRequest = rads[0].radRequest[j];
        radRequest.push(rads[0].radRequest[j]);
        count++;
        const key = rads[0].radRequest[j].type.replace(/\s/g, '');
        if (key in countWithTest === false) {
          countWithTest[key] = 1;
        } else {
          countWithTest[key] = countWithTest[key] + 1;
        }
      }
    }
    obj.rads = { ...countWithTest };
    obj.tests = count;
    newArray.push(obj);
  }

  res.status(200).json({
    success: true,
    data: newArray,
  });
});

exports.searchRadTestsStats = asyncHandler(async (req, res, next) => {
  const rads = await EDR.aggregate([
    {
      $project: {
        radRequest: 1,
      },
    },
    {
      $unwind: '$radRequest',
    },
    {
      $match: { 'radRequest.status': 'completed' },
    },
    {
      $group: {
        _id: 'radRequest',
        radRequest: { $push: '$radRequest' },
      },
    },
  ]);
  const radDoctors = await Staff.find({ staffType: 'Imaging Technician' })
    .select('identifier name chiefComplaint shift')
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
    ]);
  const staff = [];

  for (let i = 0; i < radDoctors.length; i++) {
    const obj = JSON.parse(JSON.stringify(radDoctors[i]));
    let count = 0;
    const countWithTest = {};
    const radRequest = [];
    for (let j = 0; j < rads[0].radRequest.length; j++) {
      if (
        radDoctors[i]._id.toString() ===
        rads[0].radRequest[j].imageTechnicianId.toString()
      ) {
        // obj.radRequest = rads[0].radRequest[j];
        radRequest.push(rads[0].radRequest[j]);
        count++;
        const key = rads[0].radRequest[j].type.replace(/\s/g, '');
        if (key in countWithTest === false) {
          countWithTest[key] = 1;
        } else {
          countWithTest[key] = countWithTest[key] + 1;
        }
      }
    }
    obj.rads = { ...countWithTest };
    obj.tests = count;
    staff.push(obj);
  }

  const arr = searchStaff(req, staff);

  res.status(200).json({
    success: true,
    data: arr,
  });
});

// Additional Roles API
exports.getAdditionalRoles = asyncHandler(async (req, res, next) => {
  const additionRoles = [
    'Head Of Radiology Department',
    'Shift Nursing Supervisor',
    'Medical Director',
    'Nursing Director',
    'Admission officer',
    'Head of patient services',
    'House keeping supervisor',
    'Laundry Supervisor',
    'Customer Care Director',
    'Head of ED accountant',
    'Medical OPs',
    'RCM Team',
    'Pharmacy Manager',
    'Warehouse Supervisor',
    'Head Of Anesthesia Doctor',
    'Head of Laboratory Director',
    'Lab Supervisor',
    'Lab Director',
  ];

  res.status(200).json({
    success: true,
    data: additionRoles,
  });
});

exports.getUsersFromRole = asyncHandler(async (req, res) => {
  if (req.params.role === 'all') {
    const sensei = await Staff.find({}).populate('addedBy');
    res.status(200).json({ success: 'true', data: sensei });
  }
});
