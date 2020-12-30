const express = require('express');

const router = express.Router();

const {
  addLabService,
  updateLabService,
  getAllLabServices,
  getLabServiceByKeyword,
  // disableLabService,
  enableLabService,
  disableLabService,
} = require('../controllers/labServiceController');

router.post('/addLabService', addLabService);
router.put('/updateLabService', updateLabService);
router.get('/getAllLabServices', getAllLabServices);
router.put('/enableLabService/:id', enableLabService);
router.put('/disableLabService/:id', disableLabService);
router.get('/searchLabService/:keyword', getLabServiceByKeyword);

module.exports = router;
