const express = require('express');
const {
  generateEDR,
  getEDRs,
  getEDRById,
  getEdrPatientByKeyword,
} = require('../controllers/edrController');

const router = express.Router();

router.post('/generateEDR', generateEDR);
// router.route('/:id').get(getEDRById);
router.get('/getEDRs', getEDRs);
router.get('/searchEdrPatient/:keyword', getEdrPatientByKeyword);

module.exports = router;
