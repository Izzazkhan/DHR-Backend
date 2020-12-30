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
} = require('../controllers/careStreamController');

router.post('/addCareStream', addCareStream);
router.put('/enableCareStream/:id', enableCareStreamService);
router.put('/disableCareStream/:id', disableCareStream);
router.put('/asignCareStream', asignCareStream);
// router.put('/updateCareStream', updateCareStream);
router.get('/getAllCareStreams', getAllCareStreams);
router.get('/getMedicationsCareStreams', getMedicationsCareStreams);
router.get('/getCSPatients', getCSPatients);
router.get('/getMedicationsByIdCareStreams/:id', getMedicationsByIdCareStreams);
router.get('/searchCSPatient/:keyword', getPatientWithoutCSByKeyword);
router.get('/searchEdrwithCS/:keyword', getPatientsWithCSByKeyword);
router.get('/getEDRswithCS', getEDRswithCS);

module.exports = router;
