const express = require('express');

const router = express.Router();

const {
  addCareStream,
  updateCareStream,
  getAllCareStreams,
  activeCareStream,
} = require('../controllers/careStreamController');

router.post('/addCareStream', addCareStream);
router.put('/updateCareStream', updateCareStream);
router.get('/getAllCareStreams', getAllCareStreams);
router.put('/activeCareStream', activeCareStream);

module.exports = router;
