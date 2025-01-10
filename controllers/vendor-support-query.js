const VendorSupportQuery = require('../models/vendor-support-query');
const User = require('../models/user').User;
const { body, validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');
const { isValidId } = require('../utils/validation');

const validateVendorSupportQuery = [
    body('queryType').isIn(['Product', 'Customer', 'Settlement', 'Order', 'Video']).withMessage('Invalid query type'),
    body('initialMessage').isString().trim().isLength({ min: 1, max: 1000 }).withMessage('Initial message must be between 1 and 1000 characters')
];

const createSupportQuery = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        
        const { queryType, initialMessage } = req.body;
        const initiatorId = req.user.id;
        const initiator = await User.findById(initiatorId).select('name email role image');
        
        if (!initiator || (initiator.role !== 'admin' && initiator.role !== 'superAdmin')) {
            return res.status(403).json({ message: 'Unauthorized: Only vendors (admin) or superAdmin can initiate a support query' });
        }
        
        // Create query with atomic operation to ensure unique participant
        const vendorSupportQuery = await VendorSupportQuery.create({
            participants: [{
                user: initiatorId,
                isOnline: true,
                lastReadMessage: null
            }],
            queryType,
            messages: [{
                sender: initiatorId,
                content: sanitizeHtml(initialMessage),
                readBy: [initiatorId]
            }]
        });

        // Update user's queries list atomically
        await User.findByIdAndUpdate(
            initiatorId,
            { $addToSet: { vendorSupportQueries: vendorSupportQuery._id } },
            { new: true }
        );

        // Populate the query before sending response
        const populatedQuery = await VendorSupportQuery.findById(vendorSupportQuery._id)
            .populate('participants.user', 'name email image role username')
            .populate('messages.sender', 'name email image role username');

        // Emit Socket.IO event
        const io = req.app.get('io');
        if (io) {
            io.emit('server:newSupportQuery', populatedQuery);
        }

        res.status(201).json(populatedQuery);
    } catch (error) {
        console.log(`[ERROR] Error creating vendor support query`, { error: error.message, userId: req.user?.id });
        res.status(500).json({ message: 'Error creating vendor support query', error: error.message });
    }
};

exports.createSupportQuery = [validateVendorSupportQuery, createSupportQuery];

exports.getVendorSupportQuery = async (req, res) => {
    try {
        const { queryId } = req.params;
        const { user } = req;
        
        if (!isValidId(queryId) || !user) {
            return res.status(400).json({ message: 'Invalid query ID or user not authenticated' });
        }
        
        const query = await VendorSupportQuery.findById(queryId)
            .populate({
                path: 'participants.user',
                select: 'name email role image username'
            })
            .populate('messages.sender', 'name email role image username');
        
        if (!query) return res.status(404).json({ message: 'Vendor support query not found' });
        
        const isParticipant = query.participants.some(p => p.user && p.user._id.toString() === user.id);
        const isParticipantVendor = user.role === 'admin' && isParticipant
        const isAuthorized = (user.role === 'superAdmin' || isParticipantVendor) 
        // superAdmins can see all queries, and participants can see their own queries
        if(!isAuthorized) {
            // All other cases are unauthorized
            return res.status(403).json({ message: 'Unauthorized access' });
        }
        
        res.json(query);
    } catch (error) {
        console.error(`Error retrieving vendor support query`, { 
            error: error.message, 
            userId: req.user?.id,
            queryId: req.params.queryId
        });
        res.status(500).json({ message: 'Error retrieving vendor support query', error: error.message });
    }
};

const getUserQueriesByUserId = async (userId) => {
    return await VendorSupportQuery.find({ 'participants.user': userId })
        .populate({
            path: 'participants.user',
            select: 'name email image role username'
        })
        .select('participants messages lastMessageAt queryType')
        .populate('messages.sender', 'name email image role username')
        .sort({ lastMessageAt: -1 });
};

exports.getSupportQueries = async (req, res) => {
    try {
        const userId = req.user.id;
        if (!isValidId(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        
        const user = await User.findById(userId);
        if (user.role !== 'admin' && user.role !== 'superAdmin') {
            return res.status(403).json({ message: 'Only vendors (admins) and superAdmins can have support queries' });
        }
        
        const queries = await getUserQueriesByUserId(userId);
        res.status(200).json(queries);
    } catch (error) {
        console.error('[ERROR] Error fetching vendor support queries:', error);
        res.status(500).json({ message: 'Error fetching vendor support queries', error: error.message });
    }
};

exports.getAdminUserSupportQueries = async (req, res) => {
    try {
        const targetUserId = req.params.userId;
        if (!isValidId(targetUserId) || req.user.role !== 'superAdmin') {
            return res.status(403).json({ message: 'Unauthorized or invalid user ID' });
        }
        
        const targetUser = await User.findById(targetUserId);
        if (!targetUser || (targetUser.role !== 'admin' && targetUser.role !== 'superAdmin')) {
            return res.status(404).json({ message: 'User not found or not authorized for support queries' });
        }
        
        const queries = await getUserQueriesByUserId(targetUserId);
        res.status(200).json(queries);
    } catch (error) {
        console.error('[ERROR] Error fetching vendor support queries:', error);
        res.status(500).json({ message: 'Error fetching vendor support queries', error: error.message });
    }
};

exports.markSupportQueryAsRead = async (req, res) => {
    try {
        const { queryId } = req.params;
        const userId = req.user.id;
        
        const query = await VendorSupportQuery.findById(queryId);
        if (!query) {
            return res.status(404).json({ message: 'Query not found' });
        }
        
        const lastMessage = query.messages[query.messages.length - 1];
        if (!lastMessage) {
            return res.status(400).json({ message: 'No messages to mark as read' });
        }

        const result = await VendorSupportQuery.findOneAndUpdate(
            { _id: queryId, 'participants.user': userId },
            { $set: { 'participants.$.lastReadMessage': lastMessage._id } },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ message: 'Participant not found in query' });
        }

        res.json({ message: 'Query marked as read', lastReadMessageId: lastMessage._id });
    } catch (error) {
        console.error('[ERROR] Error marking messages as read:', error);
        res.status(500).json({ message: 'Error marking messages as read' });
    }
};

exports.getAllSupportQueries = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'superAdmin') {
            return res.status(403).json({ message: 'Forbidden: Only superAdmin can access this endpoint' });
        }
        
        const queries = await VendorSupportQuery.find()
            .populate({
                path: 'participants.user',
                select: 'name email image role username'
            })
            .populate('messages.sender', 'name email image role username')
            .sort({ createdAt: -1 });
        
        res.status(200).json(queries);
    } catch (error) {
        console.error('[ERROR] Error fetching all vendor support queries for superAdmin:', error);
        res.status(500).json({ message: 'Error fetching all vendor support queries', error: error.message });
    }
};



exports.deleteSupportQuery = async (req, res) => {
    try {
        if (req.user.role !== 'superAdmin') {
            return res.status(403).json({ message: 'Only superAdmin can delete support queries' });
        }

        const { queryId } = req.params;
        const deletedQuery = await VendorSupportQuery.findByIdAndDelete(queryId);

        if (!deletedQuery) {
            return res.status(404).json({ message: 'Support query not found' });
        }

        res.status(200).json({ message: 'Support query deleted successfully' });
    } catch (error) {
        console.error('[ERROR] Error deleting support query:', error);
        res.status(500).json({ message: 'Error deleting support query', error: error.message });
    }
};

