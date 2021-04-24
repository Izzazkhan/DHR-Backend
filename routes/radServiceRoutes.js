const express = require('express');

const {
  addRadService,
  getAllRadServices,
  updateRadService,
  getRadServiceByKeyword,
  enableRadService,
  disableRadService,
} = require('../controllers/radServiceController');

const router = express.Router();
router.post('/addRadService', addRadService);
router.get('/getAllRadServices', getAllRadServices);

router.put('/updateRadService', updateRadService);
// router.put('/activeRadService', activeRadService);
router.get('/searchRadService/:keyword', getRadServiceByKeyword);
router.put('/enableRadService/:id', enableRadService);
router.put('/disableRadService/:id', disableRadService);

module.exports = router;
