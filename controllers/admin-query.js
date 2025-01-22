/**
 * Admin Query Controller
 * 
 * Available Functions:
 * - createAdminQuery   : Create a new admin query         [Admin]
 * - getAdminQuery      : Get a specific query by ID       [Admin (admins can only view their own queries)]
 * - getMyAdminQueries  : Get all queries for current user [Admin]
 * - getAllAdminQueries : Get all queries in system        [Superadmin only]
 * - addMessage         : Add a message to query           [Admin]
 * - deleteAdminQuery   : Delete a query                   [Superadmin only]
 * - markMessageRead    : Mark a message as read           [Admin]
 * 
 * Routes and Middleware:
 * - POST /          : adminMiddleware       (createAdminQuery)
 * - GET /my         : adminMiddleware       (getMyAdminQueries)
 * - GET /:queryId   : adminMiddleware       (getAdminQuery)
 * - POST /messages  : adminMiddleware       (addMessage)
 * - POST /read      : adminMiddleware       (markMessageRead)
 * - GET /system/all : superAdminMiddleware  (getAllAdminQueries)
 * - DELETE /:queryId: superAdminMiddleware  (deleteAdminQuery)
 * 
 * Note: All routes require authentication via requireSignin middleware
 */

const AdminQuery = require('../models/admin-query');
const { validateRequest } = require('../middleware/validate-zod');
const { 
    addMessageSchema, 
    createQuerySchema, 
    deleteQuerySchema,
    getQuerySchema,
    markAsReadSchema 
} = require('../validators/schemas/admin-query');
const { isSuperAdmin } = require('../utils/validation');
const sanitizeHtml = require('sanitize-html');

// Create new admin query
exports.createAdminQuery = [
    validateRequest(createQuerySchema),
    async (req, res) => {
        try {
            const { queryType, question } = req.body;
            
            // Sanitize the question
            const sanitizedQuestion = sanitizeHtml(question);

            const adminQuery = new AdminQuery({
                queryType,
                question: sanitizedQuestion,
                userId: req.user.id
            });

            const savedQuery = await adminQuery.save();

            if (!savedQuery) {
                return res.status(400).json({
                    message: 'Could not create query',
                    success: false
                });
            }

            res.status(201).json({
                data: savedQuery,
                success: true
            });

        } catch (error) {
            console.error('Error in createAdminQuery:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
];

// Get specific query by ID
exports.getAdminQuery = [
    validateRequest(getQuerySchema),
    async (req, res) => {
        try {
            const query = await AdminQuery.findById(req.params.queryId)
                .populate('userId', 'name email role image')
                .populate('messages.userId', 'name email role image');

            if (!query) {
                return res.status(404).json({ message: 'Query not found' });
            }

            // Check access rights: user must be either a superadmin or the owner of the query
            const isQueryOwner = query.userId.toString() === req.user.id.toString();
            const isAuthorized = isSuperAdmin(req.user) || isQueryOwner;

            if (!isAuthorized) {
                return res.status(403).json({ 
                    message: 'Access denied: Must be superadmin or query owner' 
                });
            }

            res.json(query);
        } catch (error) {
            console.error('Error in getAdminQuery:', error);
            res.status(500).json({ message: error.message });
        }
    }
];

// Get queries for current admin - No schema needed as it uses authenticated user's ID
exports.getMyAdminQueries = async (req, res) => {
    try {
        const queries = await AdminQuery.find({ userId: req.user.id })
            .populate('userId', 'name email role image')
            .populate('messages.userId', 'name email role image')
            .sort('-updatedAt');

        res.json(queries);
    } catch (error) {
        console.error('Error in getMyAdminQueries:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get all queries (superadmin only)
exports.getAllAdminQueries = async (req, res) => {
    try {
        const queries = await AdminQuery.find()
            .populate('userId', 'name email role image')
            .populate('messages.userId', 'name email role image')
            .sort('-updatedAt');

        res.json(queries);
    } catch (error) {
        console.error('Error in getAllAdminQueries:', error);
        res.status(500).json({ message: error.message });
    }
};

// Add message to query
exports.addMessage = [
    validateRequest(addMessageSchema),
    async (req, res) => {
        try {
            const { queryId } = req.params;
            const { content } = req.body;
            
            const query = await AdminQuery.findById(queryId);
            if (!query) {
                return res.status(404).json({ message: 'Query not found' });
            }

            const message = {
                content: sanitizeHtml(content),
                readBy: [req.user.id],
                userId: req.user.id,
                userRole: req.user.role
            };

            query.messages.push(message);
            await query.save();

            // Populate the newly added message
            const populatedQuery = await AdminQuery.findById(queryId)
                .populate('userId', 'name email role image')
                .populate('messages.userId', 'name email role image');

            const newMessage = populatedQuery.messages[populatedQuery.messages.length - 1];

            res.status(201).json(newMessage);
        } catch (error) {
            console.error('Error in addMessage:', error);
            res.status(500).json({ message: error.message });
        }
    }
];

// Delete query
exports.deleteAdminQuery = [
    validateRequest(deleteQuerySchema),
    async (req, res) => {
        try {
            const { queryId } = req.params;
            
            const query = await AdminQuery.findById(queryId);
            if (!query) {
                return res.status(404).json({ message: 'Query not found' });
            }

            await AdminQuery.findByIdAndDelete(queryId);
            res.json({ message: 'Query deleted successfully' });
        } catch (error) {
            console.error('Error in deleteAdminQuery:', error);
            res.status(500).json({ message: error.message });
        }
    }
];

// Mark message as read
exports.markMessageRead = [
    validateRequest(markAsReadSchema),
    async (req, res) => {
        try {
            const { queryId, messageId } = req.params;
            
            const query = await AdminQuery.findById(queryId);
            if (!query) {
                return res.status(404).json({ message: 'Query not found' });
            }

            const message = query.messages.id(messageId);
            if (!message) {
                return res.status(404).json({ message: 'Message not found' });
            }

            if (!message.readBy.includes(req.user.id)) {
                message.readBy.push(req.user.id);
                await query.save();
            }

            res.json({ message: 'Message marked as read' });
        } catch (error) {
            console.error('Error in markMessageRead:', error);
            res.status(500).json({ message: error.message });
        }
    }
];
