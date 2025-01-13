const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    lastReadMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    }
});

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
    participants: [participantSchema],
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
}, { 
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            if (ret.participants) {
                ret.participants.forEach(p => {
                    if (p.user && p.user.id) {
                        delete p.user.id;
                    }
                });
            }
            return ret;
        }
    },
    toObject: {
        transform: function (doc, ret) {
            if (ret.participants) {
                ret.participants.forEach(p => {
                    if (p.user && p.user.id) {
                        delete p.user.id;
                    }
                });
            }
            return ret;
        }
    }
});

// Add indexes for better query performance
vendorSupportQuerySchema.index({ lastMessageAt: -1 });
vendorSupportQuerySchema.index({ '_id': 1, 'participants.user': 1 }, { unique: true });

// Add method to safely add participant
vendorSupportQuerySchema.methods.addParticipant = async function(userId) {
    const exists = this.participants.some(p => 
        p.user.toString() === userId.toString()
    );
    
    if (!exists) {
        this.participants.push({
            user: userId,
            lastReadMessage: null
        });
        return await this.save();
    }
    return this;
};

// Add a pre-save hook to ensure unique participants and valid user fields
vendorSupportQuerySchema.pre('save', function(next) {
    // Remove duplicates while preserving order
    const seen = new Set();
    this.participants = this.participants.filter(p => {
        if (!p.user) return false;
        const userId = p.user.toString();
        const duplicate = seen.has(userId);
        seen.add(userId);
        return !duplicate;
    });
    next();
});

// Method to find a participant by user ID
vendorSupportQuerySchema.methods.findParticipant = function(userId) {
    return this.participants.find(p => p.user.toString() === userId.toString());
};

// Virtual to get unread messages count for a participant
vendorSupportQuerySchema.virtual('unreadMessagesCount').get(function() {
    return function(userId) {
        const participant = this.participants.find(p => p.user.toString() === userId.toString());
        if (!participant || !participant.lastReadMessage) return this.messages.length;
        return this.messages.filter(m => m.timestamp > participant.lastReadMessage).length;
    };
});

// Method to update lastReadMessage for a participant
vendorSupportQuerySchema.methods.updateLastReadMessage = function(userId, messageId) {
    const participant = this.findParticipant(userId);
    if (participant) {
        participant.lastReadMessage = messageId;
    }
    return this.save();
};

module.exports = mongoose.model('VendorSupportQuery', vendorSupportQuerySchema);
