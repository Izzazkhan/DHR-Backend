const express = require('express');

const router = express.Router();

const {
  paramedicsEdr,
  transferredParamedicsEdr,
  edrTransfer,
  searchPendingPMEdr,
  searchCompletedPMEdr,
} = require('../controllers/paramedics');

router.get('/paramedicsEdr', paramedicsEdr);
router.get('/transferredPMEdr', transferredParamedicsEdr);
router.get('/edrTransfer/:edrId', edrTransfer);
router.get('/searchPendingPMEdr/:keyword', searchPendingPMEdr);
router.get('/searchCompletedPMEdr/:keyword', searchCompletedPMEdr);

module.exports = router;
