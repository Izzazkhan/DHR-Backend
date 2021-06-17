const express = require('express');

const router = express.Router();

const {
  addCareStream,
  // updateCareStream,
  enableCareStreamService,
  disableCareStream,
  getAllCareStreams,
  getMedicationsByIdCareStreams,
  getMedicationsCareStreams,
  asignCareStream,
  getCSPatients,
  getPatientWithoutCSByKeyword,
  getPatientsWithCSByKeyword,
  getEDRswithCS,
  getAllEnableDisableCareStreams,
  getInProgressCS,
  searchInProgressCS,
  completeCareStream,
  edInProgressCS,
  getCompletedCS,
} = require('../controllers/careStreamController');

router.post('/addCareStream', addCareStream);
router.put('/enableCareStream/:id', enableCareStreamService);
router.put('/disableCareStream/:id', disableCareStream);
router.put('/asignCareStream', asignCareStream);
// router.put('/updateCareStream', updateCareStream);
router.get('/getAllCareStreams', getAllCareStreams);
router.get('/getAllEnableDisableCareStreams', getAllEnableDisableCareStreams);
router.get('/getMedicationsCareStreams', getMedicationsCareStreams);
router.get('/getCSPatients/:staffId', getCSPatients);
router.get('/getMedicationsByIdCareStreams/:id', getMedicationsByIdCareStreams);
router.get('/searchCSPatient/:keyword', getPatientWithoutCSByKeyword);
router.get('/searchEdrwithCS/:keyword/:staffId', getPatientsWithCSByKeyword);
router.get('/getEDRswithCS/:staffId', getEDRswithCS);
router.get('/getInProgressCS', getInProgressCS);
router.get('/searchInProgressCS/:keyword', searchInProgressCS);
router.put('/completeCS', completeCareStream);
router.get('/edInProgressCS', edInProgressCS);
router.get('/getCompletedCS', getCompletedCS);
module.exports = router;
