const express = require('express');

const router = express.Router();

const {
  addFlag,
  getAllCompletedFlag,
  getAllPendingFlag,
  getFlagCount,
  getFlagPatientByKeyword,
} = require('../controllers/flagController');

router.post('/addFlag', addFlag);
router.get('/getAllCompletedFlag', getAllCompletedFlag);
router.get('/getAllPendingFlag', getAllPendingFlag);
router.get('/getFlagCount', getFlagCount);
router.get('/getFlagPatientByKeyword/:keyword', getFlagPatientByKeyword);

module.exports = router;
