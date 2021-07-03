const express = require('express');

const router = express.Router();

const {
  getCurrentShiftDocs,
  getNextShiftDocs,
  submitTransfer,
  getCurrentShiftNurses,
} = require('../controllers/transferOfCare');

router.get('/getCurrentShiftDocs/:staffId', getCurrentShiftDocs);
router.get('/getNextShiftDocs/:staffId', getNextShiftDocs);
router.get('/getCurrentShiftNurses/:staffId', getCurrentShiftNurses);
router.post('/submitTransfer', submitTransfer);

module.exports = router;
