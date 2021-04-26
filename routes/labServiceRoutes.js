const express = require('express');

const router = express.Router();

const {
  addLabService,
  updateLabService,
  getAllLabServices,
  getLabServiceByKeyword,
  enableLabService,
  disableLabService,
  AllLabServices,
  LabServiceByKeyword,
} = require('../controllers/labServiceController');

router.post('/addLabService', addLabService);
router.put('/updateLabService', updateLabService);
router.get('/getAllLabServices', getAllLabServices);
router.get('/allLabServices', AllLabServices);
router.put('/enableLabService/:id', enableLabService);
router.put('/disableLabService/:id', disableLabService);
router.get('/searchLabService/:keyword', getLabServiceByKeyword);
router.get('/searchAllLabs/:keyword', LabServiceByKeyword);

module.exports = router;
