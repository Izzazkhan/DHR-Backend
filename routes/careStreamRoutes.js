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
} = require('../controllers/careStreamController');

router.post('/addCareStream', addCareStream);
router.put('/enableCareStream/:id', enableCareStreamService);
router.put('/disableCareStream/:id', disableCareStream);
// router.put('/updateCareStream', updateCareStream);
router.get('/getAllCareStreams', getAllCareStreams);
router.get('/getMedicationsCareStreams', getMedicationsCareStreams);
router.get('/getMedicationsByIdCareStreams/:id', getMedicationsByIdCareStreams);

module.exports = router;
