const express = require('express');
const router = express.Router();
const { requireSignin, adminMiddleware } = require('../common-middleware');
const {getUserAddress, updateAddress, deleteAddress, createAddress, updateDefaultAddress} = require('../controllers/address')

router.get('/:id', getUserAddress);
router.post('/:id', createAddress, requireSignin);
router.put('/:id', updateAddress, requireSignin);
router.delete('/:id', deleteAddress, requireSignin);
router.put(`/updatedefault/:id`, updateDefaultAddress, requireSignin);

module.exports = router;