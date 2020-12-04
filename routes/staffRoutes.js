const express = require('express');
const multer = require('multer');
const { protect } = require('../controllers/authController');

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

const {
  registerStaff,
  getAllStaff,
} = require('../controllers/staffController');

const router = express.Router();

const upload = multer({ storage: storage });
router.post('/registerStaff', upload.single('file'), registerStaff);
router.get('/getAllStaff', getAllStaff);

module.exports = router;
