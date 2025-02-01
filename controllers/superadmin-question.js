const mongoose = require('mongoose');
const { isValidObjectId } = require('mongoose');
const { SuperAdminQuestion } = require("../models/superadmin-question");

// Fetch all questions
exports.getQuestions = async (req, res) => {
    try {
        const questions = await SuperAdminQuestion.find()
            .sort({ createdAt: -1 })
            .populate("userId", "name image username role")
            .populate("answers.userId", "name username image role")
        res.json(questions);
    } catch (error) {
        console.error('Error in getQuestions:', error);
        res.status(500).json({ message: "Error fetching questions", error: error.message });
    }
};

exports.getQuestionsByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        console.log('Getting questions for userId:', userId);

        if (!isValidObjectId(userId)) {
            return res.status(400).json({ message: "Invalid user ID format" });
        }

        const questions = await SuperAdminQuestion.find({ userId })
            .sort({ createdAt: -1 })
            .populate("userId", "name image username role")
            .populate("answers.userId", "name username image role");

        console.log(`Found ${questions.length} questions for user ${userId}`);
        res.json(questions);
    } catch (error) {
        console.error('Error in getQuestionsByUser:', error);
        res.status(500).json({ 
            message: "Error fetching user's questions", 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Get a single question by ID
exports.getQuestionById = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate id format
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: "Invalid question ID format" });
        }

        const question = await SuperAdminQuestion.findById(id)
            .populate("userId", "name image username role")
            .populate("answers.userId", "name username image role");

        if (!question) {
            return res.status(404).json({ error: "Question not found" });
        }
        res.json(question);
    } catch (error) {
        console.error('Error in getQuestionById:', error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

// Add a new question
exports.addQuestion = async (req, res) => {
    try {
        const { question, questionType } = req.body;
        
        // Get userId from authenticated user
        const userId = req.user?.id;
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        const newQuestion = new SuperAdminQuestion({
            question,
            questionType,
            userId,
            answers: []
        });

        const savedQuestion = await newQuestion.save();
        const populatedQuestion = await SuperAdminQuestion.findById(savedQuestion._id)
            .populate("userId", "name image username role")
            .populate("answers.userId", "name username image role");

        res.status(201).json(populatedQuestion);
    } catch (error) {
        console.error('Error in addQuestion:', error);
        res.status(500).json({ error: "Error creating question", details: error.message });
    }
};

// Add an answer to a question
exports.addAnswer = async (req, res) => {
    try {
        const { text } = req.body;
        const userId = req.user?.id;
        const userRole = req.user?.role;
        const { id: questionId } = req.params;

        // Validate questionId format
        if (!isValidObjectId(questionId)) {
            return res.status(400).json({ error: "Invalid question ID format" });
        }

        const question = await SuperAdminQuestion.findById(questionId);
        if (!question) {
            return res.status(404).json({ error: "Question not found" });
        }

        // Add answer with initial read status false
        question.answers.push({
            text,
            userId,
            isRead: false // New answers start as unread
        });

        // Update repliedBySuperadmin flag for mobile compatibility
        if (userRole === 'superAdmin') {
            question.repliedBySuperadmin = true;
        }

        await question.save();

        const updatedQuestion = await SuperAdminQuestion.findById(questionId)
            .populate("userId", "name image username role")
            .populate("answers.userId", "name username image role");

        res.json(updatedQuestion);
    } catch (error) {
        console.error('Error in addAnswer:', error);
        res.status(500).json({ error: "Error adding answer", details: error.message });
    }
};

// Legacy edit endpoint - keep as is for mobile app
exports.editQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;
        const { text, isReadByAdmin, isReadBySuperadmin } = req.body;

        // Validate questionId format
        if (!isValidObjectId(questionId)) {
            return res.status(400).json({ error: "Invalid question ID format" });
        }

        const question = await SuperAdminQuestion.findById(questionId);
        if (!question) {
            return res.status(404).json({ error: "Question not found" });
        }

        if (text) question.text = text;
        if (typeof isReadByAdmin !== 'undefined') question.isReadByAdmin = isReadByAdmin;
        if (typeof isReadBySuperadmin !== 'undefined') question.isReadBySuperadmin = isReadBySuperadmin;

        await question.save();
        const updatedQuestion = await SuperAdminQuestion.findById(questionId)
            .populate("userId", "name image username role")
            .populate("answers.userId", "name username image role");
        res.json(updatedQuestion);
    } catch (error) {
        console.error('Error in editQuestion:', error);
        res.status(500).json({ error: "Error updating question", details: error.message });
    }
};

// New endpoint for read status. Used by web superadmin-question feature.
exports.updateAnswerReadStatus = async (req, res) => {
    try {
        const { questionId } = req.params;
        const currentUserRole = req.user.role;
        
        // Validate questionId and fetch question
        if (!isValidObjectId(questionId)) {
            return res.status(400).json({ error: "Invalid question ID format" });
        }
        const question = await SuperAdminQuestion.findById(questionId);
        if (!question) {
            return res.status(404).json({ error: "Question not found" });
        }

        // Get the latest answer
        const answers = question.answers || [];
        if (answers.length === 0) {
            return res.status(200).json({ success: true }); // No answers to mark as read
        }

        const latestAnswer = answers[answers.length - 1];

        // Only update read status if viewer is different role than sender
        if (latestAnswer.userId.role !== currentUserRole) {
            latestAnswer.isRead = true;
            
            // Update repliedBySuperadmin for mobile compatibility if superadmin is reading
            if (currentUserRole === 'superAdmin' && !question.repliedBySuperadmin) {
                question.repliedBySuperadmin = true;
            }
            
            await question.save();
        }

        // Return success without sensitive data
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error in updateAnswerReadStatus:', error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};