const express = require('express');
const {
  getPAs,
  createPA,
  disablePA,
  enablePA,
  getPARooms,
} = require('../controllers/productionArea');

const router = express.Router();
router.get('/getProductionAreas', getPAs);
router.post('/createProductionArea', createPA);
router.put('/disableProductionArea/:id', disablePA);
router.put('/enableProductionArea/:id', enablePA);
router.get('/getPARooms/:paId', getPARooms);

module.exports = router;
