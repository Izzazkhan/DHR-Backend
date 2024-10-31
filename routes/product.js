const express = require('express');

const router = express.Router();

const {
  addProduct,
  getProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/Product');

router.post('/addProduct', addProduct);
router.get('/getProduct', getProduct);
router.put('/updateProduct', updateProduct);
router.delete('/deleteProduct/:id', deleteProduct);

module.exports = router;
