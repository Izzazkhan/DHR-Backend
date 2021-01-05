const express = require('express');
const {
  //   getInsurance,
  //   getInsuranceById,
  //   addInsurance,
  //   deleteInsurance,
  //   updateInsurance,
  addInsuranceVendor,
  addInsuranceItem,
  verify,
  // pushVendors
} = require('../controllers/insuranceController.js');

const router = express.Router();
// router.get('/getinsurance', getInsurance);
// router.get('/getinsurancebyid/:_id', getInsuranceById);
router.get('/verify/:id', verify);
// router.get('/push/:id', pushVendors);
// router.post('/addinsurance', addInsurance);
// router.delete('/deleteinsurance/:_id', deleteInsurance);
// router.put('/updateinsurance', updateInsurance);
router.post('/addinsurancevendor', addInsuranceVendor);
router.post('/addinsuranceitem', addInsuranceItem);
module.exports = router;
