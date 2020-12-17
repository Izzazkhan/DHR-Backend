const express = require('express');
const {
  generateEDR,
  getEDRs,
  getEDRById,
} = require('../controllers/edrController');

const router = express.Router();

router.post('/generateEDR', generateEDR);
// router.route('/:id').get(getEDRById);
router.get('/getEDRs', getEDRs);

module.exports = router;
