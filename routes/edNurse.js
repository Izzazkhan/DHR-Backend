const express = require('express');

const router = express.Router();

const {
  getLab,
  getRad,
  submitRequest,
} = require('../controllers/edNurseRequests');

router.get('/getLab', getLab);
router.get('/getRad', getRad);
router.post('/submitRequest', getRad);

module.exports = router;
