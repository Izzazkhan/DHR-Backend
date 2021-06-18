const express = require('express');

const router = express.Router();

const {
  getCurrentShiftDocs,
  getNextShiftDocs,
} = require('../controllers/transferOfCare');

router.get('/getCurrentShiftDocs/:staffId', getCurrentShiftDocs);
router.get('/getNextShiftDocs/:staffId', getNextShiftDocs);

module.exports = router;
