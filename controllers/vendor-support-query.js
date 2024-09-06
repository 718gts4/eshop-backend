const VendorSupportQuery = require('../models/vendor-support-query');
const User = require('../models/user').User;
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');

const validateVendorSupportQuery = [
    body('queryType').isIn(['Product', 'Customer', 'Settlement', 'Order', 'Video']).withMessage('Invalid query type'),
    body('initialMessage').isString().trim().isLength({ min: 1, max: 1000 }).withMessage('Initial message must be between 1 and 1000 characters')
];

const validateMessage = [
    body('content').isString().trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be between 1 and 1000 characters')
];

// Controller function
const createVendorSupportQuery = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { queryType, initialMessage } = req.body;
        console.log(`[INFO] Creating vendor support query`, { 
            body: req?.body, 
            user: req?.user,
            headers: req.headers
        });
        
        if (!req.user || !req.user.userId) {
            console.log("[ERROR] User not authenticated", { 
                user: req.user, 
                headers: req.headers
            });
            return res.status(401).json({ message: 'Unauthorized: User not authenticated' });
        }

        const initiatorId = req.user.userId;
        console.log("[INFO] Initiator ID:", initiatorId);
        const initiator = await User.findById(initiatorId).select('name email role image');

        if (!initiator) {
            console.log("[ERROR] Initiator not found", { initiatorId });
            return res.status(404).json({ message: 'User not found' });
        }

        console.log("[INFO] Initiator details:", {
            id: initiator._id,
            name: initiator.name,
            email: initiator.email,
            role: initiator.role,
            hasImage: !!initiator.image,
            imageValue: initiator.image
        });

        if (initiator.role !== 'admin' && initiator.role !== 'superAdmin' && initiator.role !== 'vendor') {
            return res.status(403).json({ message: 'Vendor support query can only be initiated by a vendor or admin' });
        }

        const vendorSupportQuery = new VendorSupportQuery({
            participants: [initiatorId],
            queryType,
            messages: [{
                sender: initiatorId,
                content: sanitizeHtml(initialMessage)
            }]
        });

        const savedVendorSupportQuery = await vendorSupportQuery.save();
        await User.findByIdAndUpdate(initiatorId, { $push: { vendorSupportQueries: savedVendorSupportQuery._id } });

        console.log(`[INFO] Vendor support query created by user ${initiatorId}`, { queryId: savedVendorSupportQuery._id });
        res.status(201).json(savedVendorSupportQuery);
    } catch (error) {
        console.log(`[ERROR] Error creating vendor support query`, { error: error.message, userId: req.user ? req.user.userId : 'Unknown' });
        res.status(500).json({ message: 'Error creating vendor support query', error: error.message });
    }
};

// Export the route handler with middleware
exports.createVendorSupportQuery = [validateVendorSupportQuery, createVendorSupportQuery];

exports.getVendorSupportQuery = async (req, res) => {
    try {
        const queryId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(queryId)) {
            return res.status(400).json({ message: 'get vendor query: Invalid vendor support query ID' });
        }

        const vendorSupportQuery = await VendorSupportQuery.findById(queryId).populate({
            path: 'participants',
            select: 'name email role image'
        });
        
        if (!vendorSupportQuery) {
            return res.status(404).json({ message: 'Vendor support query not found' });
        }

        if (!vendorSupportQuery.participants.some(p => p._id.toString() === req.user.id)) {
            console.log(`[WARN] Unauthorized vendor support query access attempt`, { userId: req.user.id, queryId });
            return res.status(403).json({ message: 'You are not authorized to view this vendor support query' });
        }

        console.log('[DEBUG] Populated vendor support query:', JSON.stringify(vendorSupportQuery, null, 2));

        // Log information about each participant's image
        vendorSupportQuery.participants.forEach((participant, index) => {
            console.log(`[DEBUG] Participant ${index + 1} image:`, {
                userId: participant._id,
                name: participant.name,
                hasImage: !!participant.image,
                imageValue: participant.image
            });
        });

        // Populate sender information for each message
        await VendorSupportQuery.populate(vendorSupportQuery, {
            path: 'messages.sender',
            select: 'name email role image'
        });

        // Log information about each message sender's image
        vendorSupportQuery.messages.forEach((message, index) => {
            console.log(`[DEBUG] Message ${index + 1} sender image:`, {
                userId: message.sender._id,
                name: message.sender.name,
                hasImage: !!message.sender.image,
                imageValue: message.sender.image
            });
        });

        console.log(`[INFO] Vendor support query retrieved`, { userId: req.user.id, queryId });
        res.json(vendorSupportQuery);
    } catch (error) {
        console.log(`[ERROR] Error retrieving vendor support query`, { error: error.message, userId: req.user.id });
        res.status(500).json({ message: 'Error retrieving vendor support query', error: error.message });
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
        const queryId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(queryId)) {
            return res.status(400).json({ message: 'addMessage: Invalid vendor support query ID' });
        }

        const vendorSupportQuery = await VendorSupportQuery.findById(queryId);
        
        if (!vendorSupportQuery) {
            return res.status(404).json({ message: 'Vendor support query not found' });
        }

        if (!vendorSupportQuery.participants.includes(senderId)) {
            return res.status(403).json({ message: 'User is not a participant in this vendor support query' });
        }

        vendorSupportQuery.messages.push({ sender: senderId, content: sanitizeHtml(content) });
        vendorSupportQuery.lastMessageAt = Date.now();
        
        const updatedVendorSupportQuery = await vendorSupportQuery.save();

        console.log(`[INFO] Message added to vendor support query`, { queryId, senderId });
        res.json(updatedVendorSupportQuery);
    } catch (error) {
        console.log(`[ERROR] Error adding message to vendor support query`, { error: error.message, userId: req.user.id });
        res.status(500).json({ message: 'Error adding message', error: error.message });
    }
};

exports.addMessage = [validateMessage, addMessageController];

exports.getVendorSupportQueriesByUser = async (req, res) => {
    try {
        const userId = req.params.userId;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        // Only allow vendors to access their own vendor support queries, or helpdesk support to access any queries
        if (userId !== req.user.id && req.user.role !== 'superAdmin') {
            return res.status(403).json({ message: 'You are not authorized to view these vendor support queries' });
        }

        // If the user is not a helpdesk support, force the userId to be their own
        const queryUserId = (req.user.role === 'superAdmin') ? userId : req.user.id;

        const vendorSupportQueries = await VendorSupportQuery.find({ participants: queryUserId })
                                .populate('participants', 'name email')
                                .sort({ lastMessageAt: -1 });
        res.json(vendorSupportQueries);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving vendor support queries', error: error.message });
    }
};

exports.markMessagesAsRead = async (req, res) => {
    try {
        const queryId = req.params.id;
        const userId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(queryId) || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid vendor support query ID or user ID' });
        }

        const vendorSupportQuery = await VendorSupportQuery.findById(queryId);

        if (!vendorSupportQuery) {
            return res.status(404).json({ message: 'Vendor support query not found' });
        }

        if (!vendorSupportQuery.participants.includes(userId)) {
            return res.status(403).json({ message: 'User is not a participant in this vendor support query' });
        }

        // Mark all unread messages as read
        vendorSupportQuery.messages.forEach(message => {
            if (!message.readBy.includes(userId)) {
                message.readBy.push(userId);
            }
        });

        const updatedVendorSupportQuery = await vendorSupportQuery.save();
        res.json(updatedVendorSupportQuery);
    } catch (error) {
        res.status(500).json({ message: 'Error marking messages as read', error: error.message });
    }
};

exports.getUserVendorSupportQueries = async (req, res) => {                                      
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const queries = await VendorSupportQuery.find({ participants: req.user.userId })                                         
        .populate('participants', 'name email image username')                                                 
        .populate('messages.sender', 'name email image username')                                              
        .sort({ createdAt: -1 });                                                               
                                                                                                
      res.status(200).json(queries);                                                            
    } catch (error) {                                                                           
      console.error('[ERROR] Error fetching user vendor support queries:', error);                   
      res.status(500).json({ message: 'Error fetching user vendor support queries' });               
    }                                                                                           
  };  

exports.getVendorSupportQueryMessages = async (req, res) => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const queries = await VendorSupportQuery.find({ participants: req.user.userId })
            .populate('participants', 'name email image username')
            .populate('messages.sender', 'name email image username')
            .sort({ createdAt: -1 });

        const messages = queries.flatMap(query => query.messages);

        res.status(200).json(messages);
    } catch (error) {
        console.error('[ERROR] Error fetching vendor support query messages:', error);
        res.status(500).json({ message: 'Error fetching vendor support query messages' });
    }
};

exports.getAllVendorSupportQueriesForSuperAdmin = async (req, res) => {
    try {
        if (!req.user || !req.user.userId || req.user.role !== 'superAdmin') {
            return res.status(403).json({ message: 'Unauthorized: Only superAdmin can access this endpoint' });
        }

        const queries = await VendorSupportQuery.find()
            .populate('participants', 'name email image username')
            .populate('messages.sender', 'name email image username')
            .sort({ createdAt: -1 });

        res.status(200).json(queries);
    } catch (error) {
        console.error('[ERROR] Error fetching all vendor support queries for superAdmin:', error);
        res.status(500).json({ message: 'Error fetching all vendor support queries' });
    }
};

module.exports = exports;
