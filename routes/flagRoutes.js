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
router.get('/getAllCompletedFlag/:generatedFrom', getAllCompletedFlag);
router.get('/getAllPendingFlag/:generatedFrom', getAllPendingFlag);
router.put('/updateFlag', updateFlag);
router.get('/getFlagCount/:generatedFrom', getFlagCount);
router.get('/getFlagPatientByKeyword/:keyword', getFlagPatientByKeyword);

module.exports = router;
