const express = require('express');

const router = express.Router();

const {
  paramedicsEdr,
  transferredParamedicsEdr,
  edrTransfer,
} = require('../controllers/paramedics');

router.get('/paramedicsEdr', paramedicsEdr);
router.get('/transferredPMEdr', transferredParamedicsEdr);
router.get('/edrTransfer/:edrId', edrTransfer);

module.exports = router;
