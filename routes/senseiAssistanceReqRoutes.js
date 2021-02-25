const express = require('express');
const {
  getAssistanceRequestForNurse,
  updateAssistanceRequestForNurse,
  addAssistanceRequestForNurse,
  completeAssistanceRequestForNurse,
} = require('../controllers/senseiAssistanceReqController');

const router = express.Router();

router.post('/addReqForNurse', addAssistanceRequestForNurse);
router.put('/updateReqForNurse', updateAssistanceRequestForNurse);
router.put('/completeReqForNurse', completeAssistanceRequestForNurse);
router.get('/getReqForNurse/:nurseId', getAssistanceRequestForNurse);

module.exports = router;
