const express = require('express');

const router = express.Router();

const {
  getPendingTransfers,
  getCompletedTransfers,
  addReport,
} = require('../controllers/nurseTechnicianRequest');

router.get('/getPendingTransfers/:staffId', getPendingTransfers);
router.get('/getCompletedTransfers/:staffId', getCompletedTransfers);
router.put('/addReport', addReport);

module.exports = router;
