const mongoose = require('mongoose');

// Schema for replies (answers to questions)
const answerSchema = new mongoose.Schema({
    text: { type: String, required: true },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: { type: Date, default: Date.now },
    isReadByAdmin: { type: Boolean, default: false },     // Only checked for latest answer
    isReadBySuperadmin: { type: Boolean, default: false }, // Only checked for latest answer
    isReadByUser: { type: Boolean, default: false }        // New field to track read status by user
});

// Schema for questions
const superadminquestionSchema = new mongoose.Schema({
    question: { type: String, required: true }, // Main question text
    questionType: { type: String, enum: ['Product', 'Customer', 'Settlement', 'Order', 'Video'] }, // Optional to maintain backward compatibility
    answers: [answerSchema],                   // Array of answers
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    repliedBySuperadmin: {
        type: Boolean,
        default: false
    },
    createdAt: { type: Date, default: Date.now },
});

exports.SuperAdminQuestion = mongoose.model('SuperAdminQuestion', superadminquestionSchema);
