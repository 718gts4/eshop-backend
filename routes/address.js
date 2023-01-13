const addressController = require('path/to/address/controller');
const {getAddressId, updateAddress, deleteAddress, createAddressAndAddToUser} = require('../controllers/address')
const express = require('express');
const router = express.Router();
const { requireSignin, adminMiddleware } = require('../common-middleware');

router.get('/:id', getAddressId);
router.post('/:id', createAddressAndAddToUser, requireSignin);
router.put('/:id', updateAddress, requireSignin);
router.delete('/:id', deleteAddress, requireSignin);

module.exports = router;