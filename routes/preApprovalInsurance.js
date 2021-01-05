const express = require('express');

const {
  getEDRandIPR,
  getEDRandIPRKeyword,
  addPAR,
  updatePAR,
} = require('../controllers/preApprovalInsurance');

const router = express.Router();

router.get('/getedrandipr', getEDRandIPR);
// router.get('/getedrandipr/:keyword', getEDRandIPRKeyword);
// router.post('/addpar', addPAR);
// router.put('/updatepar', updatePAR);

module.exports = router;
