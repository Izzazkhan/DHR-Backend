const express = require('express');

const router = express.Router();
const {
  getDischargedEDRs,
  getAdmittedEDRs,
  getTransferedEDRs,
  getDeceasedEDRs,
  getCompletedAdmittedEDRs,
  getCompletedDeceasedEDRs,
  getCompletedDischargedEDRs,
  getCompletedTransferedEDRs,
  addSurvey,
  getPsychiatrist,
  getMentalCare,
  getAdvocate,
  sendEmail,
  getSWAssistance,
  searchSWAssistance,
} = require('../controllers/socialWorker');

router.get('/getDischargedEDRs', getDischargedEDRs);
router.get('/getAdmittedEDRs', getAdmittedEDRs);
router.get('/getTransferedEDRs', getTransferedEDRs);
router.get('/getDeceasedEDRs', getDeceasedEDRs);
router.get('/getCompletedAdmittedEDRs', getCompletedAdmittedEDRs);
router.get('/getCompletedDeceasedEDRs', getCompletedDeceasedEDRs);
router.get('/getCompletedDischargedEDRs', getCompletedDischargedEDRs);
router.get('/getCompletedTransferedEDRs', getCompletedTransferedEDRs);
router.put('/addSurvey', addSurvey);
router.get('/getPsychiatrist', getPsychiatrist);
router.get('/getMentalCare', getMentalCare);
router.get('/getAdvocate', getAdvocate);
router.get('/getSWAssistance', getSWAssistance);
router.get('/searchSWAssistance/:keyword', searchSWAssistance);
router.put('/sendEmail', sendEmail);

module.exports = router;
