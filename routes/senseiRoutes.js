const express = require('express');
// const { protect } = require('../controllers/authController');
const {
  updateStaffShift,
  getCCPatients,
  getPatientsByPA,
  patientsByCC,
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
} = require('../controllers/senseiController');

const router = express.Router();
router.put('/assignShifts', updateStaffShift);
router.get('/getCCPatients', getCCPatients);
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
router.get('/getPatientTreatment', getPatientTreatment);
router.get('/getMedicationReconciliation', getMedicationReconciliation);
// router.get('/getNoOfPatientsByCC/:id', getNoOfPatientsByCC);
router.get('/getPatientByRoom/:roomId', getPatientByRoom);
router.get('/searchCCPatients/:keyword', searchCCPatients);
router.get('/searchEDPatients/:keyword', searchEDPatients);
router.get('/searchEOUPatients/:keyword', searchEOUPatients);
module.exports = router;
