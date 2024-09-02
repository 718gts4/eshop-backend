const express = require('express');
const router = express.Router();
const vendorSupportQueryController = require('../controllers/chat');
const authJwt = require('../helpers/jwt');

router.post('/', authJwt(), vendorSupportQueryController.createChat);
router.get('/:id', authJwt(), vendorSupportQueryController.getChat);
router.post('/:id/messages', authJwt(), vendorSupportQueryController.addMessage);
router.get('/user/:userId', authJwt(), vendorSupportQueryController.getChatsByUser);
router.post('/:id/read', authJwt(), vendorSupportQueryController.markMessagesAsRead);

module.exports = router;
