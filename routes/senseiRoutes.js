const express = require('express');
// const { protect } = require('../controllers/authController');
const {
  updateStaffShift,
  getCCPatients,
  getPatientsByPA,
  patientsByCC,
  getCCPatientsED,
  // getNoOfPatientsByCC,
  getPatientByRoom,
  searchCCPatients,
  getCR,
  getEDPatients,
  getEOUPatients,
  searchEDPatients,
  searchEOUPatients,
  timeInterval,
  transferToEOU,
  getDischarged,
  getLabTest,
  getDeceased,
  availableEdBeds,
  getEDCCPatients,
  getPatientTreatment,
  getMedicationReconciliation,
  currentTimeInterval,
  getCurrentLabTest,
  getCurrentRadTest,
  getCriticalLabTest,
  getDischargedRequirements,
  getEDCSPatients,
  deathOccurredPerCS,
  getRadTest,
  chiefComplaintBeds,
  csInProgress,
  medicationRequestsED,
  patientShiftedInEOU,
  // Eou Room Stats
  eouTimeInterval,
  eouTransferRequest,
  doctorResponseTime,
} = require('../controllers/senseiController');

const router = express.Router();
router.put('/assignShifts', updateStaffShift);
router.get('/getCCPatients', getCCPatients);
router.get('/getCCPatientsED', getCCPatientsED);
router.get('/getPatientsByPA/:productionAreaId', getPatientsByPA);
router.get('/patientsByCC', patientsByCC);
router.get('/getCR', getCR);
router.get('/getEDPatients', getEDPatients);
router.get('/getEOUPatients', getEOUPatients);
router.get('/timeInterval', timeInterval);
router.get('/transferToEOU', transferToEOU);
router.get('/getDischarged', getDischarged);
router.get('/getLabTest', getLabTest);
router.get('/getDeceased', getDeceased);
router.get('/availableEdBeds', availableEdBeds);
router.get('/getEDCCPatients', getEDCCPatients);
router.get('/getEDCSPatients', getEDCSPatients);
router.get('/getPatientTreatment', getPatientTreatment);
router.get('/getMedicationReconciliation', getMedicationReconciliation);
router.get('/currentTimeInterval', currentTimeInterval);
router.get('/getCurrentLabTest', getCurrentLabTest);
router.get('/getCurrentRadTest', getCurrentRadTest);
router.get('/getCriticalLabTest', getCriticalLabTest);
router.get('/getDischargedRequirements', getDischargedRequirements);
// router.get('/getNoOfPatientsByCC/:id', getNoOfPatientsByCC);
router.get('/getPatientByRoom/:roomId', getPatientByRoom);
router.get('/searchCCPatients/:keyword', searchCCPatients);
router.get('/searchEDPatients/:keyword', searchEDPatients);
router.get('/searchEOUPatients/:keyword', searchEOUPatients);
router.get('/deathOccurredPerCS', deathOccurredPerCS);
router.get('/getRadTest', getRadTest);
router.get('/chiefComplaintBeds', chiefComplaintBeds);
router.get('/csInProgress', csInProgress);
router.get('/medicationRequestsED', medicationRequestsED);
router.get('/patientShiftedInEOU', patientShiftedInEOU);
// EOU Room stats
router.get('/eouTimeInterval', eouTimeInterval);
router.get('/eouTransferRequest', eouTransferRequest);
router.get('/doctorResponseTime', doctorResponseTime);
module.exports = router;
