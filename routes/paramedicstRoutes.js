const express = require('express');

const router = express.Router();

const {
  paramedicsEdr,
  edrFromParamedics,
  transferredParamedicsEdr,
  edrTransfer,
  searchPendingPMEdr,
  searchCompletedPMEdr,
  searchPMEdr
} = require('../controllers/paramedics');

router.get('/paramedicsEdr', paramedicsEdr);
router.get('/edrFromParamedics', edrFromParamedics);
router.get('/transferredPMEdr', transferredParamedicsEdr);
router.put('/edrTransfer', edrTransfer);
router.get('/searchPendingPMEdr/:keyword', searchPendingPMEdr);
router.get('/searchCompletedPMEdr/:keyword', searchCompletedPMEdr);
router.get('/searchPMEdr/:keyword', searchPMEdr);

module.exports = router;
