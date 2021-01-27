const express = require('express');

const router = express.Router();

const {
  getPendingTransfers,
  getCompletedTransfers,
  addReport,
  getpendingLabs,
  getCompletedLabs,
  completeLab,
} = require('../controllers/nurseTechnicianRequest');

router.get('/getPendingTransfers/:staffId', getPendingTransfers);
router.get('/getCompletedTransfers/:staffId', getCompletedTransfers);
router.get('/getpendingLabs/:staffId', getpendingLabs);
router.get('/getCompletedLabs/:staffId', getCompletedLabs);
router.put('/completeLab', completeLab);
router.put('/addReport', addReport);

module.exports = router;
