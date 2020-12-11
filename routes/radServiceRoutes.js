const express = require('express');

const {
  addRadService,
  getAllRadServices,
  //   updateRadService,
  getRadServiceByKeyword,
} = require('../controllers/radServiceController');

const router = express.Router();
router.post('/addRadService', addRadService);
router.get('/getAllRadServices', getAllRadServices);

// router.put('/updateRadService', updateRadService);
// router.put('/activeRadService', activeRadService);
router.get('/searchRadService/:keyword', getRadServiceByKeyword);

module.exports = router;
