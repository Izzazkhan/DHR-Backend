const requestNoFormat = require('dateformat');
const Flag = require('../models/flag/Flag');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// exports.addFlag = asyncHandler(async (req, res, next) => {
//   const { edrId, generatedBy, generatedTo, reason } = req.body;
//   const flag = await Flag.create({
//     edrId,
//     generatedBy,
//     generatedTo,
//     reason,
//   });
//   res.status(201).json({
//     success: true,
//     data: flag,
//   });
// });

exports.getAllPendingFlag = asyncHandler(async (req, res, next) => {
  const flag = await Flag.find({
    status: 'pending',
    generatedFor: req.params.generatedFor,
  }).populate([
    {
      path: 'edrId',
      model: 'EDR',
      select: 'patientId',
      populate: [
        {
          path: 'patientId',
          model: 'patientfhir',
          select: 'identifier name',
        },
      ],
    },
    {
      path: 'patientId',
      model: 'patientfhir',
      select: 'identifier name',
    },
    // {
    //   path: 'generatedBy',
    //   model: 'staff',
    // },
  ]);
  res.status(200).json({
    success: true,
    data: flag,
  });
});

exports.updateFlag = asyncHandler(async (req, res, next) => {
  let flag;
  if (req.body.status === 'in_progress') {
    flag = await Flag.findOneAndUpdate(
      { _id: req.body.flagId },
      {
        $set: {
          status: req.body.status,
          inProgressTime: Date.now(),
          inProgressBy: req.body.staffId,
        },
      },
      { $new: true }
    ).populate([
      {
        path: 'edrId',
        model: 'EDR',
        select: 'patientId',
        populate: [
          {
            path: 'patientId',
            model: 'patientfhir',
            select: 'identifier name',
          },
        ],
      },
      {
        path: 'generatedBy',
        model: 'staff',
      },
      {
        path: 'patientId',
        model: 'patientfhir',
        select: 'identifier name',
      },
    ]);
  }

  if (req.body.status === 'completed') {
    flag = await Flag.findOneAndUpdate(
      { _id: req.body.flagId },
      {
        $set: {
          status: req.body.status,
          completedTime: Date.now(),
          completedBy: req.body.staffId,
        },
      },
      { $new: true }
    ).populate([
      {
        path: 'edrId',
        model: 'EDR',
        select: 'patientId',
        populate: [
          {
            path: 'patientId',
            model: 'patientfhir',
            select: 'identifier name',
          },
        ],
      },
      {
        path: 'generatedBy',
        model: 'staff',
      },
      {
        path: 'patientId',
        model: 'patientfhir',
        select: 'identifier name',
      },
    ]);
  }

  res.status(200).json({
    success: true,
    data: flag,
  });
});

exports.getAllCompletedFlag = asyncHandler(async (req, res, next) => {
  const flag = await Flag.find({
    status: 'completed',
    generatedFor: req.params.generatedFor,
  }).populate([
    {
      path: 'edrId',
      model: 'EDR',
      select: 'patientId',
      populate: [
        {
          path: 'patientId',
          model: 'patientfhir',
          select: 'identifier name',
        },
      ],
    },
    {
      path: 'patientId',
      model: 'patientfhir',
      select: 'identifier name',
    },
    // {
    //   path: 'generatedBy',
    //   model: 'staff',
    // },
  ]);
  res.status(200).json({
    success: true,
    data: flag,
  });
});

exports.getFlagCount = asyncHandler(async (req, res, next) => {
  const flag = await Flag.find({
    generatedFor: req.params.generatedFor,
  }).countDocuments();
  res.status(200).json({
    success: true,
    data: flag,
  });
});

exports.getFlagPatientByKeyword = asyncHandler(async (req, res, next) => {
  const filteredArray = [];

  const flag = await Flag.find().populate([
    {
      path: 'edrId',
      model: 'EDR',
      populate: [
        {
          path: 'patientId',
          model: 'patientfhir',
        },
      ],
    },
    {
      path: 'generatedBy',
      model: 'staff',
    },
  ]);

  for (let index = 0; index < flag.length; index++) {
    const paramsInLowerCase = req.params.keyword.toLowerCase();

    const element = flag[index];

    const givenName = element.edrId.patientId.name[0].given[0]
      .toLowerCase()
      .startsWith(paramsInLowerCase);

    const familyName = element.edrId.patientId.name[0].family
      .toLowerCase()
      .startsWith(paramsInLowerCase);

    const mrn = element.edrId.patientId.identifier[0].value
      .toLowerCase()
      .startsWith(paramsInLowerCase);

    const fullName =
      element.edrId.patientId.name[0].given[0] +
      ' ' +
      element.edrId.patientId.name[0].family;

    if (
      familyName ||
      givenName ||
      mrn ||
      fullName.toLowerCase().startsWith(paramsInLowerCase)
    ) {
      filteredArray.push(element);
    }
  }

  res.status(200).json({
    success: true,
    data: filteredArray,
  });
});
