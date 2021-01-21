const express = require('express');

const router = express.Router();
const {
  getDischargedEDRs,
  getAdmittedEDRs,
  getTransferedEDRs,
  getDeceasedEDRs,
  addSurvey,
} = require('../controllers/socialWorker');

router.get('/getDischargedEDRs', getDischargedEDRs);
router.get('/getAdmittedEDRs', getAdmittedEDRs);
router.get('/getTransferedEDRs', getTransferedEDRs);
router.get('/getDeceasedEDRs', getDeceasedEDRs);
router.put('/addSurvey', addSurvey);

module.exports = router;
