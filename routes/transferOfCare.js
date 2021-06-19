const express = require('express');

const router = express.Router();

const {
  getCurrentShiftDocs,
  getNextShiftDocs,
  submitTransfer,
} = require('../controllers/transferOfCare');

router.get('/getCurrentShiftDocs/:staffId', getCurrentShiftDocs);
router.get('/getNextShiftDocs/:staffId', getNextShiftDocs);
router.post('/submitTransfer', submitTransfer);

module.exports = router;
