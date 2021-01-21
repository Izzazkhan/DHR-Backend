const express = require('express');

const router = express.Router();
const {
  getDischargedEDRs,
  getAdmittedEDRs,
  getTransferedEDRs,
  getDeceasedEDRs,
  addSurvey,
  getPsychiatrist,
  getMentalCare,
  getAdvocate,
} = require('../controllers/socialWorker');

router.get('/getDischargedEDRs', getDischargedEDRs);
router.get('/getAdmittedEDRs', getAdmittedEDRs);
router.get('/getTransferedEDRs', getTransferedEDRs);
router.get('/getDeceasedEDRs', getDeceasedEDRs);
router.put('/addSurvey', addSurvey);
router.get('/getPsychiatrist', getPsychiatrist);
router.get('/getMentalCare', getMentalCare);
router.get('/getAdvocate', getAdvocate);

module.exports = router;
