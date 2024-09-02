const Chat = require('../models/chat');
const User = require('../models/user');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');

const vendorSupportQueryController = {
    validateChat: [
        body('queryType').isIn(['Product', 'Customer', 'Settlement', 'Order', 'Video']).withMessage('Invalid query type'),
        body('initialMessage').isString().trim().isLength({ min: 1, max: 1000 }).withMessage('Initial message must be between 1 and 1000 characters')
    ],

    validateMessage: [
        body('content').isString().trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be between 1 and 1000 characters')
    ],

    // Controller function
    createChatController: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { queryType, initialMessage } = req.body;
        const initiatorId = req.user.id;

        const initiator = await User.findById(initiatorId);

        if (!initiator || (initiator.role !== 'admin' && initiator.role !== 'superAdmin' && initiator.role !== 'vendor')) {
            return res.status(403).json({ message: 'Chat can only be initiated by a vendor or admin' });
        }

        const chat = new Chat({
            participants: [initiatorId],
            queryType,
            messages: [{
                sender: initiatorId,
                content: sanitizeHtml(initialMessage)
            }]
        });

        const savedChat = await chat.save();
        await User.findByIdAndUpdate(initiatorId, { $push: { chats: savedChat._id } });

        console.log(`[INFO] Chat created by user ${initiatorId}`, { chatId: savedChat._id });
        res.status(201).json(savedChat);
    } catch (error) {
        console.log(`[ERROR] Error creating chat`, { error: error.message, userId: req.user.id });
        res.status(500).json({ message: 'Error creating chat', error: error.message });
    }
};

// Export the route handler with middleware
vendorSupportQueryController.createChat = [vendorSupportQueryController.validateChat, vendorSupportQueryController.createChatController];

exports.getChat = async (req, res) => {
    try {
        const chatId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(chatId)) {
            return res.status(400).json({ message: 'Invalid chat ID' });
        }

        const chat = await Chat.findById(chatId).populate({
            path: 'participants',
            select: 'name email role'
        });
        
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        if (!chat.participants.some(p => p._id.toString() === req.user.id)) {
            console.log(`[WARN] Unauthorized chat access attempt`, { userId: req.user.id, chatId });
            return res.status(403).json({ message: 'You are not authorized to view this chat' });
        }

        // Populate sender information for each message
        await Chat.populate(chat, {
            path: 'messages.sender',
            select: 'name email role'
        });

        console.log(`[INFO] Chat retrieved`, { userId: req.user.id, chatId });
        res.json(chat);
    } catch (error) {
        console.log(`[ERROR] Error retrieving chat`, { error: error.message, userId: req.user.id });
        res.status(500).json({ message: 'Error retrieving chat', error: error.message });
    }
};

const addMessageController = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { content } = req.body;
        const senderId = req.user.id;
        const chatId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(chatId)) {
            return res.status(400).json({ message: 'Invalid chat ID' });
        }

        const chat = await Chat.findById(chatId);
        
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        if (!chat.participants.includes(senderId)) {
            return res.status(403).json({ message: 'User is not a participant in this chat' });
        }

        chat.messages.push({ sender: senderId, content: sanitizeHtml(content) });
        chat.lastMessage = Date.now();
        
        const updatedChat = await chat.save();

        console.log(`[INFO] Message added to chat`, { chatId, senderId });
        res.json(updatedChat);
    } catch (error) {
        console.log(`[ERROR] Error adding message to chat`, { error: error.message, userId: req.user.id });
        res.status(500).json({ message: 'Error adding message', error: error.message });
    }
};

exports.addMessage = [validateMessage, addMessageController];

exports.getChatsByUser = async (req, res) => {
    try {
        const userId = req.params.userId;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        // Only allow vendors to access their own chats, or helpdesk support to access any chats
        if (userId !== req.user.id && req.user.role !== 'superAdmin') {
            return res.status(403).json({ message: 'You are not authorized to view these chats' });
        }

        // If the user is not a helpdesk support, force the userId to be their own
        const queryUserId = (req.user.role === 'superAdmin') ? userId : req.user.id;

        const chats = await Chat.find({ participants: queryUserId })
                                .populate('participants', 'name email')
                                .sort({ lastMessage: -1 });
        res.json(chats);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving chats', error: error.message });
    }
};

vendorSupportQueryController.markMessagesAsRead = async (req, res) => {
    try {
        const chatId = req.params.id;
        const userId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(chatId) || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid chat ID or user ID' });
        }

        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        if (!chat.participants.includes(userId)) {
            return res.status(403).json({ message: 'User is not a participant in this chat' });
        }

        // Mark all unread messages as read
        chat.messages.forEach(message => {
            if (!message.readBy.includes(userId)) {
                message.readBy.push(userId);
            }
        });

        const updatedChat = await chat.save();
        res.json(updatedChat);
    } catch (error) {
        res.status(500).json({ message: 'Error marking messages as read', error: error.message });
    }
};

module.exports = vendorSupportQueryController;
