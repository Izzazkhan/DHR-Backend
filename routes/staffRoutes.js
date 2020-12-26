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
  disableStaff,
  enableStaff,
  updateStaff,
  getDoctorSubTypes,
  getNurseSubTypes,
  getDoctorSpecialty,
  getNurseSpecialty,
  getEDDoctors,
  getAllSensei,
  getUsersFromRole
} = require('../controllers/staffController');

const router = express.Router();
router.post('/registerStaff', upload.single('file'), registerStaff);
router.get('/getAllStaff', getAllStaff);
router.get('/geteddoctors', getEDDoctors);
router.put('/disableStaff/:id', disableStaff);
router.put('/enableStaff/:id', enableStaff);
router.put('/updateStaff', upload.single('file'), updateStaff);
router.get('/getDoctorSubTypes', getDoctorSubTypes);
router.get('/getNurseSubTypes', getNurseSubTypes);
router.get('/getDoctorSpecialty', getDoctorSpecialty);
router.get('/getNurseSpecialty', getNurseSpecialty);
router.get('/getAllSensei', getAllSensei);
router.get('/getUsersFromRole/:role', getUsersFromRole);
module.exports = router;
