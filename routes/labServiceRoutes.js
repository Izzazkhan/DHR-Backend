const express = require('express');

const router = express.Router();

const {
  addLabService,
  updateLabService,
  getAllLabServices,
  activeLabService,
  getLabSeriviceByKeyword,
} = require('../controllers/labServiecController');

router.post('/addLabService', addLabService);
router.put('/updateLabService', updateLabService);
router.get('/getAllLabServices', getAllLabServices);
router.put('/activeLabService', activeLabService);
router.get('/searchLabService/:keyword', getLabSeriviceByKeyword);

module.exports = router;
