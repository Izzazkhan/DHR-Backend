const express = require('express');
const multer = require('multer');
// const { protect } = require('../controllers/authController');

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

const {
  registerStaff,
  getAllStaff,
  activeStaff,
  updateStaff,
  getDoctorSubTypes,
  getNurseSubTypes,
  getDoctorSpecialty,
  getNurseSpecialty,
} = require('../controllers/staffController');

const router = express.Router();
router.post('/registerStaff', upload.single('file'), registerStaff);
router.get('/getAllStaff', getAllStaff);
router.put('/activeStaff/:id', activeStaff);
router.put('/updateStaff', upload.single('file'), updateStaff);
router.get('/getDoctorSubTypes', getDoctorSubTypes);
router.get('/getNurseSubTypes', getNurseSubTypes);
router.get('/getDoctorSpecialty', getDoctorSpecialty);
router.get('/getNurseSpecialty', getNurseSpecialty);

module.exports = router;
