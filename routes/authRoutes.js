const express = require('express');

const router = express.Router();
const {
  login,
  logout,
  forgotPassword,
  resetPassword,
  updatePassword,
} = require('../controllers/authController');

router.post('/login', login);
router.post('/logout', logout);
router.put('/forgotPassword', forgotPassword);
router.post('/resetPassword', resetPassword);
router.put('/updatePassword', updatePassword);

module.exports = router;
