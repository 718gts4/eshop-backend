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

// SuperAdmin endpoints (can see and manage all questions)
router.get('/', requireSignin, superAdminMiddleware, getQuestions);
router.put(`/:questionId`, requireSignin, superAdminMiddleware, editQuestion); // Legacy endpoint for mobile app

// Admin endpoints (can see their own questions and reply)
// More specific routes should come after generic ones
router.get("/user/:userId", requireSignin, adminMiddleware, getQuestionsByUser);
router.get('/:id', requireSignin, adminMiddleware, getQuestionById);
router.post('/', requireSignin, adminMiddleware, addQuestion);
router.post('/:id/answers', requireSignin, adminMiddleware, addAnswer);
// Most specific route should be last
router.put('/:questionId/read-status', requireSignin, adminMiddleware, updateAnswerReadStatus);

module.exports = router;