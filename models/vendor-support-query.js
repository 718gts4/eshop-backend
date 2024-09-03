const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
});

const vendorSupportQuerySchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    messages: [messageSchema],
    lastMessageAt: {
        type: Date,
        default: Date.now
    },
    queryType: {
        type: String,
        enum: ['Product', 'Customer', 'Settlement', 'Order', 'Video'],
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('VendorSupportQuery', vendorSupportQuerySchema);
