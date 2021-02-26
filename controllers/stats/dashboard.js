const moment = require('moment');
const Patient = require('../../models/patient/patient');
const Room = require('../../models/room');

const asyncHandler = require('../../middleware/async');
const ErrorResponse = require('../../utils/errorResponse');
const EDR = require('../../models/EDR/EDR');

const currentTime = moment().utc().toDate();
const lastHour = moment().subtract(1, 'hours').utc().toDate();
const fifthHour = moment().subtract(2, 'hours').utc().toDate();
const fourthHour = moment().subtract(3, 'hours').utc().toDate();
const thirdHour = moment().subtract(4, 'hours').utc().toDate();
const secondHour = moment().subtract(5, 'hours').utc().toDate();
const sixHour = moment().subtract(6, 'hours').utc().toDate();

let arr = [
  { label: lastHour, value: 0 },
  { label: fifthHour, value: 0 },
  { label: fourthHour, value: 0 },
  { label: thirdHour, value: 0 },
  { label: secondHour, value: 0 },
  { label: sixHour, value: 0 },
];

function clearAllTime() {
  arr = [
    { label: lastHour, value: 0 },
    { label: fifthHour, value: 0 },
    { label: fourthHour, value: 0 },
    { label: thirdHour, value: 0 },
    { label: secondHour, value: 0 },
    { label: sixHour, value: 0 },
  ];
}

function compareDataForSixHours(dateTime) {
  if (dateTime > lastHour && dateTime < currentTime) {
    arr[0] = { label: arr[0].label, value: arr[0].value + 1 };
  } else if (dateTime > fifthHour && dateTime < lastHour) {
    arr[1] = { label: arr[1].label, value: arr[1].value + 1 };
  } else if (dateTime > fourthHour && dateTime < fifthHour) {
    arr[2] = { label: arr[2].label, value: arr[2].value + 1 };
  } else if (dateTime > thirdHour && dateTime < fourthHour) {
    arr[3] = { label: arr[3].label, value: arr[3].value + 1 };
  } else if (dateTime > secondHour && dateTime < thirdHour) {
    arr[4] = { label: arr[4].label, value: arr[4].value + 1 };
  } else if (dateTime > sixHour && dateTime < secondHour) {
    arr[5] = { label: arr[5].label, value: arr[5].value + 1 };
  }
}

// For 3 times
function compareData(hold, active, requested) {
  if (
    (hold > lastHour && hold < currentTime) ||
    (active > lastHour && active < currentTime) ||
    (requested > lastHour && requested < currentTime)
  ) {
    arr[0] = { label: arr[0].label, value: arr[0].value + 1 };
  } else if (
    (hold > fifthHour && hold < lastHour) ||
    (active > fifthHour && active < lastHour) ||
    (requested > fifthHour && requested < lastHour)
  ) {
    arr[1] = { label: arr[1].label, value: arr[1].value + 1 };
  } else if (
    (hold > fourthHour && hold < fifthHour) ||
    (active > fourthHour && active < fifthHour) ||
    (requested > fourthHour && requested < fifthHour)
  ) {
    arr[2] = { label: arr[2].label, value: arr[2].value + 1 };
  } else if (
    (hold > thirdHour && hold < fourthHour) ||
    (active > thirdHour && active < fourthHour) ||
    (requested > thirdHour && requested < fourthHour)
  ) {
    arr[3] = { label: arr[3].label, value: arr[3].value + 1 };
  } else if (
    (hold > secondHour && hold < thirdHour) ||
    (active > secondHour && active < thirdHour) ||
    (requested > secondHour && requested < thirdHour)
  ) {
    arr[4] = { label: arr[4].label, value: arr[4].value + 1 };
  } else if (
    (hold > sixHour && hold < secondHour) ||
    (active > sixHour && active < secondHour) ||
    (requested > sixHour && requested < secondHour)
  ) {
    arr[5] = { label: arr[5].label, value: arr[5].value + 1 };
  }
}
// Clinical Pharmacist Dashboard
exports.cpDashboard = asyncHandler(async (req, res, next) => {
  const pendingOrders = await EDR.aggregate([
    {
      $project: {
        pharmacyRequest: 1,
      },
    },
    {
      $unwind: '$pharmacyRequest',
    },
    {
      $match: {
        $and: [
          { 'pharmacyRequest.status': 'pending' },
          { 'pharmacyRequest.createdAt': { $gte: sixHour } },
        ],
      },
    },
  ]);

  pendingOrders.map((o) => compareDataForSixHours(o.pharmacyRequest.createdAt));

  const perHour = JSON.parse(JSON.stringify(arr));
  clearAllTime();

  //   TAT
  const completedOrders = await EDR.aggregate([
    {
      $project: {
        pharmacyRequest: 1,
      },
    },
    {
      $unwind: '$pharmacyRequest',
    },
    {
      $match: {
        $and: [
          { 'pharmacyRequest.status': 'in_progress' },
          { 'pharmacyRequest.progressStartTime': { $gte: sixHour } },
        ],
      },
    },
  ]);

  let orderTime = 0;
  completedOrders.forEach((t) => {
    t.startTime = new Date(t.pharmacyRequest.createdAt);
    t.endTime = new Date(t.pharmacyRequest.progressStartTime);
    t.time = Math.round(
      (t.endTime.getTime() - t.startTime.getTime()) / (1000 * 60)
    );
    orderTime += t.time;
  });
  const orderTAT =
    completedOrders.length > 0 ? orderTime / completedOrders.length : 0;

  // * 3rd Card
  completedOrders.map((o) => {
    compareDataForSixHours(o.pharmacyRequest.progressStartTime);
  });

  const CompletedPerHour = JSON.parse(JSON.stringify(arr));
  clearAllTime();
  const orderCompletedTAT =
    completedOrders.length > 0 ? 360 / completedOrders.length : 0;

  // Cumulative Number Of Orders
  const cumulativeOrders = await EDR.aggregate([
    {
      $project: {
        pharmacyRequest: 1,
      },
    },
    {
      $unwind: '$pharmacyRequest',
    },
    {
      $match: {
        'pharmacyRequest.status': 'in_progress',
      },
    },
  ]);

  res.status(200).json({
    success: true,
    firstCard: {
      TAT: orderTAT,
      totalPending: pendingOrders.length,
      perHour,
    },
    thirdCard: {
      TAT: orderCompletedTAT,
      totalPending: completedOrders.length,
      perHour: CompletedPerHour,
    },
    cumulativeOrders: cumulativeOrders.length,
  });
});

// * Imaging Technician Dashboard
exports.itDashboard = asyncHandler(async (req, res, next) => {
  const pendingRads = await EDR.aggregate([
    {
      $project: {
        radRequest: 1,
      },
    },
    {
      $unwind: '$radRequest',
    },
    {
      $match: {
        $and: [
          {
            $or: [
              { 'radRequest.status': 'pending' },
              { 'radRequest.status': 'active' },
              { 'radRequest.status': 'hold' },
            ],
          },
          {
            $or: [
              { 'radRequest.holdTime': { $gte: sixHour } },
              { 'radRequest.activeTime': { $gte: sixHour } },
              { 'radRequest.requestedAt': { $gte: sixHour } },
            ],
          },
        ],
      },
    },
  ]);

  pendingRads.map((o) =>
    compareData(
      o.radRequest.holdTime,
      o.radRequest.activeTime,
      o.radRequest.requestedAt
    )
  );

  const perHour = JSON.parse(JSON.stringify(arr));
  clearAllTime();

  //   TAT
  const completedRads = await EDR.aggregate([
    {
      $project: {
        radRequest: 1,
      },
    },
    {
      $unwind: '$radRequest',
    },
    {
      $match: {
        $and: [
          { 'radRequest.status': 'pending approval' },
          { 'radRequest.pendingApprovalTime': { $gte: sixHour } },
        ],
      },
    },
  ]);

  let radTime = 0;
  completedRads.forEach((t) => {
    t.startTime = new Date(t.radRequest.requestedAt);
    t.endTime = new Date(t.radRequest.pendingApprovalTime);
    t.time = Math.round(
      (t.endTime.getTime() - t.startTime.getTime()) / (1000 * 60)
    );
    radTime += t.time;
  });
  const orderTAT =
    completedRads.length > 0 ? radTime / completedRads.length : 0;

  // * 2nd Card

  completedRads.map((o) =>
    compareDataForSixHours(o.radRequest.pendingApprovalTime)
  );

  const completedPerHour = JSON.parse(JSON.stringify(arr));
  clearAllTime();

  //   TAT
  const approvedRads = await EDR.aggregate([
    {
      $project: {
        radRequest: 1,
      },
    },
    {
      $unwind: '$radRequest',
    },
    {
      $match: {
        $and: [
          { 'radRequest.status': 'completed' },
          { 'radRequest.completeTime': { $gte: sixHour } },
        ],
      },
    },
  ]);

  let approvedTime = 0;
  approvedRads.forEach((t) => {
    t.startTime = new Date(t.radRequest.requestedAt);
    t.endTime = new Date(t.radRequest.completeTime);
    t.time = Math.round(
      (t.endTime.getTime() - t.startTime.getTime()) / (1000 * 60)
    );
    approvedTime += t.time;
  });
  const approvedTAT =
    approvedRads.length > 0 ? approvedTime / approvedRads.length : 0;

  // * 3rd Card
  const patients = await EDR.aggregate([
    {
      $project: {
        radRequest: 1,
      },
    },
    {
      $unwind: '$radRequest',
    },
    {
      $match: {
        'radRequest.requestedAt': { $gte: sixHour },
      },
    },
  ]);

  patients.map((o) => compareDataForSixHours(o.radRequest.requestedAt));

  const patientsPerHour = JSON.parse(JSON.stringify(arr));
  clearAllTime();

  //  * Cumulative Patients
  const cumulativePatients = await EDR.aggregate([
    {
      $project: {
        radRequest: 1,
      },
    },
    {
      $unwind: '$radRequest',
    },
    {
      $match: {
        'radRequest.status': 'pending approval',
      },
    },
  ]);

  res.status(200).json({
    success: true,
    firstCard: {
      TAT: orderTAT,
      totalPending: pendingRads.length,
      perHour,
    },
    secondCard: {
      TAT: approvedTAT,
      totalPending: completedRads.length,
      perHour: completedPerHour,
    },
    thirdCard: {
      TAT: orderTAT,
      totalPending: patients.length,
      perHour: patientsPerHour,
    },
    cumulativePatients: cumulativePatients.length,
  });
});

// * Rad Doctor Dashboard
exports.rdDashboard = asyncHandler(async (req, res, next) => {
  const pendingRad = await EDR.aggregate([
    {
      $project: {
        status: 1,
        radRequest: 1,
      },
    },
    {
      $match: {
        status: 'pending',
      },
    },
    {
      $unwind: '$radRequest',
    },
    {
      $match: {
        $and: [
          { 'radRequest.status': 'pending approval' },
          { 'radRequest.pendingApprovalTime': { $gte: sixHour } },
          { 'radRequest.pendingApprovalTime': { $lte: currentTime } },
        ],
      },
    },
  ]);
  pendingRad.map((o) =>
    compareDataForSixHours(o.radRequest.pendingApprovalTime)
  );

  const radsPerHour = JSON.parse(JSON.stringify(arr));
  clearAllTime();

  //   TAT
  const completedRad = await EDR.aggregate([
    {
      $project: {
        status: 1,
        radRequest: 1,
      },
    },
    {
      $match: {
        status: 'pending',
      },
    },
    {
      $unwind: '$radRequest',
    },
    {
      $match: {
        $and: [
          { 'radRequest.status': 'completed' },
          { 'radRequest.completeTime': { $gte: sixHour } },
          { 'radRequest.completeTime': { $lte: currentTime } },
        ],
      },
    },
  ]);

  let radTime = 0;
  completedRad.map((t) => {
    t.radStart = new Date(t.radRequest.pendingApprovalTime);

    t.radEnd = new Date(t.radRequest.completeTime);

    t.time = Math.round(
      (t.radEnd.getTime() - t.radStart.getTime()) / (1000 * 60)
    );
    radTime += t.time;
  });

  const completedRadTAT = radTime / completedRad.length;

  //   * 2nd Card
  completedRad.map((o) => compareDataForSixHours(o.radRequest.completeTime));

  const completedPerHour = JSON.parse(JSON.stringify(arr));
  clearAllTime();

  // *  Cumulative Notes
  const cumulativeNotes = await EDR.aggregate([
    {
      $project: {
        status: 1,
        radRequest: 1,
      },
    },
    {
      $match: {
        status: 'pending',
      },
    },
    {
      $unwind: '$radRequest',
    },
    {
      $match: {
        'radRequest.status': 'completed',
      },
    },
  ]);

  res.status(200).json({
    success: true,
    firstCard: {
      TAT: completedRadTAT,
      totalPending: pendingRad.length,
      perHour: radsPerHour,
    },
    secondCard: {
      TAT: completedRadTAT,
      totalPending: completedRad.length,
      perHour: completedPerHour,
    },
    cumulativeNotes: cumulativeNotes.length,
  });
});

// * Nurse Technician Dashboard
exports.ntDashboard = asyncHandler(async (req, res, next) => {
  // function compareData(observedTime, collectedTime) {
  //   if (
  //     (observedTime > lastHour && observedTime < currentTime) ||
  //     (collectedTime > lastHour && collectedTime < currentTime)
  //   ) {
  //     arr[0] = { label: arr[0].label, value: arr[0].value + 1 };
  //   } else if (
  //     (observedTime > fifthHour && observedTime < lastHour) ||
  //     (collectedTime > fifthHour && collectedTime < lastHour)
  //   ) {
  //     arr[1] = { label: arr[1].label, value: arr[1].value + 1 };
  //   } else if (
  //     (observedTime > fourthHour && observedTime < fifthHour) ||
  //     (collectedTime > fourthHour && collectedTime < fifthHour)
  //   ) {
  //     arr[2] = { label: arr[2].label, value: arr[2].value + 1 };
  //   } else if (
  //     (observedTime > thirdHour && observedTime < fourthHour) ||
  //     (collectedTime > thirdHour && collectedTime < fourthHour)
  //   ) {
  //     arr[3] = { label: arr[3].label, value: arr[3].value + 1 };
  //   } else if (
  //     (observedTime > secondHour && observedTime < thirdHour) ||
  //     (collectedTime > secondHour && collectedTime < thirdHour)
  //   ) {
  //     arr[4] = { label: arr[4].label, value: arr[4].value + 1 };
  //   } else if (
  //     (observedTime > sixHour && observedTime < secondHour) ||
  //     (collectedTime > sixHour && collectedTime < secondHour)
  //   ) {
  //     arr[5] = { label: arr[5].label, value: arr[5].value + 1 };
  //   }
  // }
  const labPending = await EDR.aggregate([
    {
      $project: {
        labRequest: 1,
      },
    },
    {
      $unwind: '$labRequest',
    },
    {
      $match: {
        $and: [
          { 'labRequest.nurseTechnicianStatus': 'Not Collected' },
          { 'labRequest.requestedAt': { $gte: sixHour } },
        ],
      },
    },
  ]);

  labPending.map((o) => compareDataForSixHours(o.labRequest.requestedAt));

  const perHour = JSON.parse(JSON.stringify(arr));
  clearAllTime();

  //   TAT

  const labCompleted = await EDR.aggregate([
    {
      $project: {
        labRequest: 1,
      },
    },
    {
      $unwind: '$labRequest',
    },
    {
      $match: {
        $and: [
          { 'labRequest.nurseTechnicianStatus': 'Collected' },
          { 'labRequest.collectedTime': { $gte: sixHour } },
        ],
      },
    },
  ]);
  let labTime = 0;
  labCompleted.map((t) => {
    t.labStart = new Date(t.labRequest.requestedAt);

    t.labEnd = new Date(t.labRequest.collectedTime);

    t.time = Math.round(
      (t.labEnd.getTime() - t.labStart.getTime()) / (1000 * 60)
    );
    labTime += t.time;
  });

  const completedLabTAT = labTime / labCompleted.length;

  //   * 2nd Card
  const transferPending = await EDR.aggregate([
    {
      $project: {
        transferOfCare: 1,
      },
    },
    {
      $unwind: '$transferOfCare',
    },
    {
      $match: {
        $and: [
          { 'transferOfCare.status': 'To Be Observed' },
          { 'transferOfCare.transferTime': { $gte: sixHour } },
        ],
      },
    },
  ]);
  transferPending.map((o) =>
    compareDataForSixHours(o.transferOfCare.transferTime)
  );

  const transferPerHour = JSON.parse(JSON.stringify(arr));
  clearAllTime();

  //   TAT;
  const transferCompleted = await EDR.aggregate([
    {
      $project: {
        transferOfCare: 1,
      },
    },
    {
      $unwind: '$transferOfCare',
    },
    {
      $match: {
        $and: [
          { 'transferOfCare.status': 'Observed' },
          { 'transferOfCare.observedTime': { $gte: sixHour } },
        ],
      },
    },
  ]);

  let transferTime = 0;
  transferCompleted.map((t) => {
    t.labStart = new Date(t.transferOfCare.transferTime);

    t.labEnd = new Date(t.transferOfCare.observedTime);

    t.time = Math.round(
      (t.labEnd.getTime() - t.labStart.getTime()) / (1000 * 60)
    );
    transferTime += t.time;
  });

  const completedTransferTAT = transferTime / transferCompleted.length;

  // * 3rd Card
  //   const labArr = JSON.parse(JSON.stringify(labCompleted));
  //   const transferArr = JSON.parse(JSON.stringify(transferCompleted));

  const totalTasks = JSON.parse(JSON.stringify(labCompleted));
  for (let i = 0; i < transferCompleted.length; i++) {
    const obj = JSON.parse(JSON.stringify(transferCompleted[i]));
    // console.log(obj);
    obj.collectedTime = obj.transferOfCare.observedTime;
    totalTasks.push(obj);
  }

  totalTasks.map((o) =>
    // console.log(o)
    compareDataForSixHours(o.collectedTime)
  );

  const tasksPerHour = JSON.parse(JSON.stringify(arr));
  clearAllTime();

  // Cumulative Total Time

  res.status(200).json({
    success: true,
    firstCard: {
      TAT: completedLabTAT,
      totalPending: labPending.length,
      perHour,
    },
    secondCard: {
      TAT: completedTransferTAT,
      totalPending: transferPending.length,
      transferPerHour,
    },
    thirdCard: {
      TAT: completedTransferTAT,
      totalPending: transferPending.length,
      tasksPerHour,
    },
  });
});

//* Lab Technician Dashboard
exports.ltDashboard = asyncHandler(async (req, res, next) => {
  const labPending = await EDR.aggregate([
    {
      $project: {
        labRequest: 1,
      },
    },
    {
      $unwind: '$labRequest',
    },
    {
      $match: {
        $and: [
          { 'labRequest.type': { $ne: 'Blood' } },
          { 'labRequest.nurseTechnicianStatus': 'Not Collected' },
          { 'labRequest.requestedAt': { $gte: sixHour } },
        ],
      },
    },
  ]);

  labPending.map((o) => compareDataForSixHours(o.labRequest.requestedAt));

  const perHour = JSON.parse(JSON.stringify(arr));
  clearAllTime();

  //   TAT

  const labCompleted = await EDR.aggregate([
    {
      $project: {
        labRequest: 1,
      },
    },
    {
      $unwind: '$labRequest',
    },
    {
      $match: {
        $and: [
          { 'labRequest.type': { $ne: 'Blood' } },
          { 'labRequest.nurseTechnicianStatus': 'Collected' },
          { 'labRequest.collectedTime': { $gte: sixHour } },
        ],
      },
    },
  ]);
  let labTime = 0;
  labCompleted.map((t) => {
    t.labStart = new Date(t.labRequest.requestedAt);

    t.labEnd = new Date(t.labRequest.collectedTime);

    t.time = Math.round(
      (t.labEnd.getTime() - t.labStart.getTime()) / (1000 * 60)
    );
    labTime += t.time;
  });

  const completedLabTAT = Math.round(labTime / labCompleted.length);

  // * 2nd Card
  const resultsPending = await EDR.aggregate([
    {
      $project: {
        labRequest: 1,
      },
    },
    {
      $unwind: '$labRequest',
    },
    {
      $match: {
        $and: [
          { 'labRequest.type': { $ne: 'Blood' } },
          {
            $or: [
              { 'labRequest.status': 'pending' },
              { 'labRequest.status': 'active' },
              { 'labRequest.status': 'hold' },
            ],
          },
          {
            $or: [
              { 'labRequest.holdTime': { $gte: sixHour } },
              { 'labRequest.activeTime': { $gte: sixHour } },
              { 'labRequest.requestedAt': { $gte: sixHour } },
            ],
          },
        ],
      },
    },
  ]);

  resultsPending.map((o) =>
    compareData(
      o.labRequest.holdTime,
      o.labRequest.activeTime,
      o.labRequest.requestedAt
    )
  );

  const pendingResultsPerHour = JSON.parse(JSON.stringify(arr));
  clearAllTime();

  // TAT
  const completedResult = await EDR.aggregate([
    {
      $project: {
        labRequest: 1,
      },
    },
    {
      $unwind: '$labRequest',
    },
    {
      $match: {
        $and: [
          { 'labRequest.status': 'completed' },
          { 'labRequest.type': { $ne: 'Blood' } },
          { 'labRequest.completeTime': { $gte: sixHour } },
        ],
      },
    },
  ]);

  let resultTime = 0;
  completedResult.map((t) => {
    t.labStart = new Date(t.labRequest.collectedTime);

    t.labEnd = new Date(t.labRequest.completeTime);

    t.time = Math.round(
      (t.labEnd.getTime() - t.labStart.getTime()) / (1000 * 60)
    );
    resultTime += t.time;
  });

  const resultTAT = Math.round(resultTime / completedResult.length);

  // * 3rd Card

  const bloodPending = await EDR.aggregate([
    {
      $project: {
        labRequest: 1,
      },
    },
    {
      $unwind: '$labRequest',
    },
    {
      $match: {
        $and: [
          { 'labRequest.type': 'Blood' },
          { 'labRequest.nurseTechnicianStatus': 'Not Collected' },
          { 'labRequest.requestedAt': { $gte: sixHour } },
        ],
      },
    },
  ]);

  bloodPending.map((o) => compareDataForSixHours(o.labRequest.requestedAt));

  const bloodPerHour = JSON.parse(JSON.stringify(arr));
  clearAllTime();

  //   TAT

  const bloodCompleted = await EDR.aggregate([
    {
      $project: {
        labRequest: 1,
      },
    },
    {
      $unwind: '$labRequest',
    },
    {
      $match: {
        $and: [
          { 'labRequest.type': 'Blood' },
          { 'labRequest.nurseTechnicianStatus': 'Collected' },
          { 'labRequest.collectedTime': { $gte: sixHour } },
        ],
      },
    },
  ]);
  let bloodTime = 0;
  bloodCompleted.map((t) => {
    t.labStart = new Date(t.labRequest.requestedAt);

    t.labEnd = new Date(t.labRequest.collectedTime);

    t.time = Math.round(
      (t.labEnd.getTime() - t.labStart.getTime()) / (1000 * 60)
    );
    bloodTime += t.time;
  });

  const bloodTAT = Math.round(bloodTime / bloodCompleted.length);

  // * 4th Card
  const bloodResultsPending = await EDR.aggregate([
    {
      $project: {
        labRequest: 1,
      },
    },
    {
      $unwind: '$labRequest',
    },
    {
      $match: {
        $and: [
          { 'labRequest.type': 'Blood' },
          {
            $or: [
              { 'labRequest.status': 'pending' },
              { 'labRequest.status': 'active' },
              { 'labRequest.status': 'hold' },
            ],
          },
          {
            $or: [
              { 'labRequest.holdTime': { $gte: sixHour } },
              { 'labRequest.activeTime': { $gte: sixHour } },
              { 'labRequest.requestedAt': { $gte: sixHour } },
            ],
          },
        ],
      },
    },
  ]);

  bloodResultsPending.map((o) =>
    compareData(
      o.labRequest.holdTime,
      o.labRequest.activeTime,
      o.labRequest.requestedAt
    )
  );

  const bloodResultsPerHour = JSON.parse(JSON.stringify(arr));
  clearAllTime();

  // TAT
  const completedBloodResult = await EDR.aggregate([
    {
      $project: {
        labRequest: 1,
      },
    },
    {
      $unwind: '$labRequest',
    },
    {
      $match: {
        $and: [
          { 'labRequest.status': 'completed' },
          { 'labRequest.type': 'Blood' },
          { 'labRequest.completeTime': { $gte: sixHour } },
        ],
      },
    },
  ]);

  let bloodResultTime = 0;
  completedBloodResult.map((t) => {
    t.labStart = new Date(t.labRequest.collectedTime);

    t.labEnd = new Date(t.labRequest.completeTime);

    t.time = Math.round(
      (t.labEnd.getTime() - t.labStart.getTime()) / (1000 * 60)
    );
    bloodResultTime += t.time;
  });

  const bloodResultTAT = Math.round(
    bloodResultTime / completedBloodResult.length
  );

  // * 5th Card
  completedResult.map((o) => compareDataForSixHours(o.labRequest.completeTime));

  const TestPerHour = JSON.parse(JSON.stringify(arr));
  clearAllTime();
  const testTAT = Math.round(360 / completedResult.length);

  // * 6th Card
  completedBloodResult.map((o) =>
    compareDataForSixHours(o.labRequest.completeTime)
  );

  const bloodTestPerHour = JSON.parse(JSON.stringify(arr));
  clearAllTime();
  const bloodTestTAT = Math.round(360 / completedBloodResult.length);

  // * 7th Card
  const cumulativeTests = await EDR.aggregate([
    {
      $project: {
        labRequest: 1,
      },
    },
    {
      $unwind: '$labRequest',
    },
    {
      $match: {
        $and: [
          { 'labRequest.status': 'completed' },
          { 'labRequest.type': { $ne: 'Blood' } },
        ],
      },
    },
  ]);

  // * 8th Card
  const cumulativeBloodTest = await EDR.aggregate([
    {
      $project: {
        labRequest: 1,
      },
    },
    {
      $unwind: '$labRequest',
    },
    {
      $match: {
        $and: [
          { 'labRequest.status': 'completed' },
          { 'labRequest.type': 'Blood' },
        ],
      },
    },
  ]);
  res.status(200).json({
    success: true,
    firstCard: {
      TAT: completedLabTAT,
      totalPending: labPending.length,
      perHour,
    },
    secondCard: {
      TAT: resultTAT,
      totalPending: resultsPending.length,
      perHour: pendingResultsPerHour,
    },
    thirdCard: {
      TAT: bloodTAT,
      totalPending: bloodPending.length,
      perHour: bloodPerHour,
    },
    fourthCard: {
      TAT: bloodResultTAT,
      totalPending: bloodResultsPending.length,
      perHour: bloodResultsPerHour,
    },
    fifthCard: {
      TAT: testTAT,
      totalPending: completedResult.length,
      perHour: TestPerHour,
    },
    sixthCard: {
      TAT: bloodTestTAT,
      totalPending: completedBloodResult.length,
      perHour: bloodTestPerHour,
    },
    cumulativeTests: cumulativeTests.length,
    cumulativeBloodTest: cumulativeBloodTest.length,
  });
});
