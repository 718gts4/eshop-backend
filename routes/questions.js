const express = require('express');
const router = express.Router();
const {
    getAllQuestions,
    getQuestionById,
    createQuestion,
    createReply,
    deleteQuestion,
    deleteReply
} = require('../controllers/question');

// Question routes
router.get('/questions', getAllQuestions);
router.get('/questions/:id', getQuestionById);
router.post('/questions', createQuestion);
router.delete('/questions/:id', deleteQuestion);

// Reply routes
router.post('/questions/:questionId/replies', createReply);
router.delete('/questions/:questionId/replies/:replyId', deleteReply);

module.exports = router;
