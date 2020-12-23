const express = require('express');
const {
  generateEDR,
  getEDRs,
  getEDRById,
  getEdrPatientByKeyword,
  getEdrsByPatient,
} = require('../controllers/edrController');

const router = express.Router();

router.post('/generateEDR', generateEDR);
router.get('/getSingleEdr/:id', getEDRById);
router.get('/getEDRs', getEDRs);
router.get('/searchEdrPatient/:keyword', getEdrPatientByKeyword);

router.get('/getEdrsByPatient/:id', getEdrsByPatient);
module.exports = router;
