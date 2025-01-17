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
  getAllParamedics,
  getUsersFromRole,
  getAllDoctors,
  searchDoctor,
  searchSensei,
  searchParamedics,
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
  searchAnesthesiologist,
  searchEdNurse,
  searchCustomerCare,
  radTestStats,
  searchExternalConsultant,
  getAllEOUNurses,
  searchEouNurses,
  externalCC,
  searchExternalCC,
  searchRadTestsStats,
  getLabTechnician,
  getRadTechnician,
  getAdditionalRoles,
  getStaffById,
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
router.get('/getAllParamedics', getAllParamedics);
router.get('/getAllDoctors', getAllDoctors);
router.get('/getUsersFromRole/:role', getUsersFromRole);
router.get('/searchDoctor/:keyword', searchDoctor);
router.get('/searchSensei/:keyword', searchSensei);
router.get('/searchParamedics/:keyword', searchParamedics);
router.get('/getSpecialityDoctor/:speciality/:staffId', getSpecialityDoctor);
router.get('/getSpecialityNurse/:speciality/:staffId', getSpecialityNurse);
router.get('/getAnesthesiologist', getAnesthesiologist);
router.get('/getEOUNurse/:speciality/:staffId', getEOUNurse);
router.get('/getNurseTechnician/:speciality/:staffId', getNurseTechnician);
router.get('/getLabTechnician/:staffId', getLabTechnician);
router.get('/getRadTechnician/:staffId', getRadTechnician);
router.get('/getAllHouseKeepers', getAllHouseKeepers);
router.get('/getCustomerCares', getCustomerCares);
router.get('/getNurseTechnicians', getNurseTechnicians);
router.get('/getEDNurses', getEDNurses);
router.get('/getExternal', getExternal);
router.get('/getAllNurses', getAllNurses);
router.get('/radTestStats', radTestStats);
router.get('/getAllEOUNurses/:staffId', getAllEOUNurses);
router.get('/externalCC', externalCC);
router.get('/searchExternalCC/:keyword', searchExternalCC);
router.get('/searchAnesthesiologist/:keyword', searchAnesthesiologist);
router.get('/searchEdNurse/:keyword', searchEdNurse);
router.get('/searchCustomerCare/:keyword', searchCustomerCare);
router.get('/searchExternalConsultant/:keyword', searchExternalConsultant);
router.get('/searchEouNurses/:keyword', searchEouNurses);
router.get('/searchRadTestsStats/:keyword', searchRadTestsStats);
router.get('/getAdditionalRoles', getAdditionalRoles);
router.get('/getStaffById/:staffId', getStaffById);
module.exports = router;
