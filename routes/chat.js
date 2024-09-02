const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat');
const authJwt = require('../helpers/jwt');

router.post('/', authJwt(), chatController.createChat);
router.get('/:id', authJwt(), chatController.getChat);
router.post('/:id/messages', authJwt(), chatController.addMessage);
router.get('/user/:userId', authJwt(), chatController.getChatsByUser);
router.post('/:id/read', authJwt(), chatController.markMessagesAsRead);

module.exports = router;
