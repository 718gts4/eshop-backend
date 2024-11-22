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
});

// Schema for questions
const superadminquestionSchema = new mongoose.Schema({
    question: { type: String, required: true }, // Main question text
    answers: [
        {
            text: { type: String, required: true },
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
            createdAt: { type: Date, default: Date.now },
        },
    ],
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: { type: Date, default: Date.now },
});

exports.SuperAdminQuestion = mongoose.model("SuperAdminQuestion", superadminquestionSchema);
