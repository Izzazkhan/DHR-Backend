const express = require('express');

const router = express.Router();
const {
  login,
  logout,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');

router.post('/login', login);
router.post('/logout', logout);
router.put('/forgotPassword', forgotPassword);
router.put('/resetPassword', resetPassword);

module.exports = router;
