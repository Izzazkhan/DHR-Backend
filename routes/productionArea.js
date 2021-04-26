const express = require('express');
const {
  getPAs,
  createPA,
  disablePA,
  enablePA,
} = require('../controllers/productionArea');

const router = express.Router();
router.get('/getProductionAreas', getPAs);
router.post('/createProductionArea', createPA);
router.put('/disableProductionArea/:id', disablePA);
router.put('/enableProductionArea/:id', enablePA);

module.exports = router;
