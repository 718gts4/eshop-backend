const mongoose = require('mongoose');
const { isValidObjectId } = require('mongoose');
const { SuperAdminQuestion } = require("../models/superadmin-question");

const isDevelopment = process.env.NODE_ENV !== 'production';

// Fetch all questions
exports.getQuestions = async (req, res) => {
    try {
        const questions = await SuperAdminQuestion.find()
            .sort({ createdAt: -1 })
            .populate("userId", "name image username role")
            .populate("answers.userId", "name username image role")
        res.json(questions);
    } catch (error) {
        if (isDevelopment) {
            console.error('Failed to fetch questions:', error.message);
        }
        res.status(500).json({ error: "Failed to fetch questions" });
    }
};

exports.getQuestionsByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!isValidObjectId(userId)) {
            return res.status(400).json({ error: "Invalid user ID format" });
        }

        const questions = await SuperAdminQuestion.find({ userId })
            .sort({ createdAt: -1 })
            .populate("userId", "name image username role")
            .populate("answers.userId", "name username image role");

        if (isDevelopment) {
            console.log(`Found ${questions.length} questions for user`);
        }
        
        res.json(questions);
    } catch (error) {
        if (isDevelopment) {
            console.error('Failed to fetch user questions:', error.message);
        }
        res.status(500).json({ error: "Failed to fetch questions" });
    }
};

// Get a single question by ID
exports.getQuestionById = async (req, res) => {
    try {
        const { id } = req.params;
        
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
        if (isDevelopment) {
            console.error('Failed to fetch question:', error.message);
        }
        res.status(500).json({ error: "Failed to fetch question" });
    }
};

exports.addQuestion = async (req, res) => {
    try {
        const { question, questionType } = req.body;
        
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
        if (isDevelopment) {
            console.error('Failed to create question:', error.message);
        }
        res.status(500).json({ error: "Failed to create question" });
    }
};

// Add an answer to a question
exports.addAnswer = async (req, res) => {
    try {
        const { text } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                error: "User ID is required"
            });
        }
        const userRole = req.user?.role;
        const { id: questionId } = req.params;

        if (process.env.NODE_ENV !== 'production') {
            console.log('Token structure:', {
                providedId: userId,
                source: req.user?.id ? 'admin login' : 'user login',
                role: userRole
            });
        }

        if (!isValidObjectId(questionId)) {
            return res.status(400).json({ error: "Invalid question ID format" });
        }

        const question = await SuperAdminQuestion.findById(questionId);
        if (!question) {
            return res.status(404).json({ error: "Question not found" });
        }

        question.answers.push({
            text,
            userId,
            isRead: false
        });

        if (userRole === 'superAdmin') {
            question.repliedBySuperadmin = true;
        }

        await question.save();

        const updatedQuestion = await SuperAdminQuestion.findById(questionId)
            .populate("userId", "name image username role")
            .populate("answers.userId", "name username image role");

        res.json(updatedQuestion);
    } catch (error) {
        if (isDevelopment) {
            console.error('Failed to add answer:', {
                error: error.message,
                user: req.user,
                providedId: req.user?.id || req.user?.userId,
                questionId
            });
        }

        res.status(500).json({ error: "Failed to add answer" });
    }
};

exports.editQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;
        const { text, isReadByAdmin, isReadBySuperadmin } = req.body;

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
        if (isDevelopment) {
            console.error('Failed to update question:', error.message);
        }
        res.status(500).json({ error: "Failed to update question" });
    }
};

// New endpoint for read status. Used by web superadmin-question feature.
exports.updateAnswerReadStatus = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Authentication required" });
        }
        
        const { questionId } = req.params;
        const currentUserRole = req.user.role;
        
        // Validate questionId and fetch question
        if (!isValidObjectId(questionId)) {
            return res.status(400).json({ error: "Invalid question ID format" });
        }
        
        const question = await SuperAdminQuestion.findById(questionId)
            .populate("answers.userId", "role");
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
        if (latestAnswer.userId?.role !== currentUserRole) {
            if (isDevelopment) {
                console.log('Marking message as read:', { questionId });
            }
            
            latestAnswer.isRead = true;
            
            // Update repliedBySuperadmin for mobile compatibility if superadmin is reading
            if (currentUserRole === 'superAdmin') {
                question.repliedBySuperadmin = true;
            }
            
            try {
                await question.save();
            } catch (error) {
                if (isDevelopment) {
                    console.error('Failed to save read status:', error.message);
                }
                return res.status(500).json({ error: "Failed to save read status" });
            }
        }

        res.status(200).json({ success: true });
    } catch (error) {
        if (isDevelopment) {
            console.error('Error updating read status:', error.message);
        }
        res.status(500).json({ error: "Internal server error" });
    }
};