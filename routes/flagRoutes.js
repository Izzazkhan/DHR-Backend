const express = require('express');

const router = express.Router();

const {
  addFlag,
  getAllCompletedFlag,
  getAllPendingFlag,
  getFlagCount,
} = require('../controllers/flagController');

router.post('/addFlag', addFlag);
router.get('/getAllCompletedFlag', getAllCompletedFlag);
router.get('/getAllPendingFlag', getAllPendingFlag);
router.get('/getFlagCount', getFlagCount);

module.exports = router;
