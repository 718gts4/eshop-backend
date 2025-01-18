const { z } = require('zod');
const { isValidObjectId } = require('mongoose');

// Custom validator for MongoDB ObjectId
const objectIdSchema = z.string().refine(val => isValidObjectId(val), {
    message: 'Invalid ID format'
});

// Base message schema matching the Mongoose model
const messageSchema = z.object({
    content: z.string()
        .min(1, 'Message cannot be empty')
        .max(1000, 'Message must be less than 1000 characters')
        .transform(val => val.trim()),
    readBy: z.array(objectIdSchema).optional(),
    userRole: z.enum(['user', 'admin', 'superAdmin']).optional()  // Optional as it might be set by the system
});

// Schema for creating a new query
const createQuerySchema = z.object({
    question: z.string()
        .min(1, 'Question cannot be empty')
        .max(1000, 'Question must be less than 1000 characters')
        .transform(val => val.trim()),
    queryType: z.enum(['Product', 'Customer', 'Settlement', 'Order', 'Video'], {
        errorMap: () => ({ message: 'Invalid query type' })
    })
});

// Schema for adding a message to an existing query
const addMessageSchema = z.object({
    body: z.object({
        content: z.string()
            .min(1, 'Message cannot be empty')
            .max(1000, 'Message must be less than 1000 characters')
            .transform(val => val.trim())
    }),
    params: z.object({
        queryId: objectIdSchema
    })
});

// Schema for marking messages as read
const markAsReadSchema = z.object({
    params: z.object({
        messageId: objectIdSchema,
        queryId: objectIdSchema
    })
});

// Schema for query status updates
const updateStatusSchema = z.object({
    status: z.enum(['closed', 'open', 'pending'])
});

// New schema for getting a query
const getQuerySchema = z.object({
    params: z.object({
        queryId: objectIdSchema
    })
});

const deleteQuerySchema = z.object({
    params: z.object({
        queryId: objectIdSchema
    })
});

module.exports = {
    addMessageSchema,
    createQuerySchema,
    deleteQuerySchema,
    getQuerySchema,
    markAsReadSchema,
    messageSchema,  // Export base schema if needed elsewhere
    objectIdSchema,  // Export for reuse in other schemas
    updateStatusSchema
};
