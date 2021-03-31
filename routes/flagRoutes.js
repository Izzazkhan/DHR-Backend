const express = require('express');

const router = express.Router();

const {
  // addFlag,
  getAllCompletedFlag,
  getAllPendingFlag,
  getFlagCount,
  getFlagPatientByKeyword,
  updateFlag,
} = require('../controllers/flagController');

// router.post('/addFlag', addFlag);
router.get('/getAllCompletedFlag/:staff/:role', getAllCompletedFlag);
router.get('/getAllPendingFlag/:staff/:role', getAllPendingFlag);
router.put('/updateFlag', updateFlag);
router.get('/getFlagCount/:generatedFor', getFlagCount);
router.get('/getFlagPatientByKeyword/:keyword', getFlagPatientByKeyword);

module.exports = router;
