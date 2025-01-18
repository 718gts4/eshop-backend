const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    content: { 
        required: true,
        type: String 
    },
    readBy: [{ 
        ref: 'User',
        type: mongoose.Schema.Types.ObjectId
    }],
    userRole: { 
        enum: ['user', 'admin', 'superAdmin'],
        required: true,
        type: String
    },
    userId: { 
        ref: 'User',
        required: true,
        type: mongoose.Schema.Types.ObjectId
    },
}, { timestamps: true });

const adminQuerySchema = new mongoose.Schema({
    messages: [messageSchema],
    queryType: {
        enum: ['Product', 'Customer', 'Settlement', 'Order', 'Video'],
        required: true,
        type: String
    },
    question: { 
        required: true,
        type: String 
    },
    userId: { 
        ref: 'User',
        required: true,
        type: mongoose.Schema.Types.ObjectId
    }
}, { timestamps: true });

module.exports = mongoose.model('AdminQuery', adminQuerySchema);
