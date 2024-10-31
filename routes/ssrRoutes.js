const express = require('express');
const {
  generateSSR,
  getSSRById,
  getSSRs,
} = require('../controllers/ssrController');

const router = express.Router();

router.post('/generateSSR', generateSSR);
router.get('/getSingleSsr/:id', getSSRById);
router.get('/getSSRs', getSSRs);

module.exports = router;
