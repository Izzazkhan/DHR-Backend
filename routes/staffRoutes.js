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
  getUsersFromRole,
  getAllDoctors,
  searchDoctor,
  searchSensei,
  getSpecialityDoctor,
  getAnesthesiologist,
  getSpecialityNurse,
  getEOUNurse,
  getNurseTechnician,
  getAllHouseKeepers,
  getCustomerCares,
  getNurseTechnicians,
  getEDNurses,
  getExternal,
  getAllNurses,
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
router.get('/getAllDoctors', getAllDoctors);
router.get('/getUsersFromRole/:role', getUsersFromRole);
router.get('/searchDoctor/:keyword', searchDoctor);
router.get('/searchSensei/:keyword', searchSensei);
router.get('/getSpecialityDoctor/:speciality', getSpecialityDoctor);
router.get('/getSpecialityNurse/:speciality', getSpecialityNurse);
router.get('/getAnesthesiologist', getAnesthesiologist);
router.get('/getEOUNurse/:speciality', getEOUNurse);
router.get('/getNurseTechnician/:speciality', getNurseTechnician);
router.get('/getAllHouseKeepers', getAllHouseKeepers);
router.get('/getCustomerCares', getCustomerCares);
router.get('/getNurseTechnicians', getNurseTechnicians);
router.get('/getEDNurses', getEDNurses);
router.get('/getExternal', getExternal);
router.get('/getAllNurses', getAllNurses);
module.exports = router;
