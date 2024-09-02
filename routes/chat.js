const express = require('express');
const router = express.Router();
const vendorSupportQueryController = require('../controllers/vendorSupportQuery');
const authJwt = require('../helpers/jwt');

router.post('/', authJwt(), vendorSupportQueryController.createVendorSupportQuery);
router.get('/:id', authJwt(), vendorSupportQueryController.getVendorSupportQuery);
router.post('/:id/messages', authJwt(), vendorSupportQueryController.addMessage);
router.get('/user/:userId', authJwt(), vendorSupportQueryController.getVendorSupportQueriesByUser);
router.post('/:id/read', authJwt(), vendorSupportQueryController.markMessagesAsRead);

module.exports = router;
