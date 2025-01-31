const express = require('express');
const router = express.Router();
const { 
    addAnswer,
    addQuestion,
    editQuestion,
    getQuestionById,
    getQuestions,
    getQuestionsByUser,
    updateAnswerReadStatus,
} = require("../controllers/superadmin-question");
const { 
    adminMiddleware,
    requireSignin,
    superAdminMiddleware,
} = require('../common-middleware');

// Admin endpoints (can see their own questions and reply)
router.get("/user/:userId", requireSignin, adminMiddleware, getQuestionsByUser);
router.get('/:id', requireSignin, adminMiddleware, getQuestionById);
router.post('/', requireSignin, adminMiddleware, addQuestion);
router.post('/:id/answers', requireSignin, adminMiddleware, addAnswer);
router.put('/:questionId/read-status', requireSignin, adminMiddleware, updateAnswerReadStatus);

// SuperAdmin endpoints (can see and manage all questions)
router.get('/', requireSignin, superAdminMiddleware, getQuestions);
router.put(`/:questionId`, requireSignin, superAdminMiddleware, editQuestion); // Legacy endpoint for mobile app

module.exports = router;