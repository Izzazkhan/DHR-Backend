const express = require('express');

const multer = require('multer');

const PATH = './uploads';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, PATH);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname
    );
  },
});

const upload = multer({ storage: storage });

const router = express.Router();
const {
  register,
  login,
  registerStaff,
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/registerStaff', upload.single('file'), registerStaff);

module.exports = router;
