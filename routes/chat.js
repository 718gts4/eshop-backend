const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat');
const authJwt = require('../helpers/jwt');

// Create a new chat
router.post('/', authJwt(), chatController.createChat);

// Get a specific chat
router.get('/:id', authJwt(), chatController.getChat);

// Add a message to a chat
router.post('/:id/messages', authJwt(), chatController.addMessage);

// Get all chats for a user
router.get('/user/:userId', authJwt(), chatController.getChatsByUser);

// Mark messages as read
router.post('/:id/read', authJwt(), chatController.markMessagesAsRead);

module.exports = router;
