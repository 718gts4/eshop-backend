const { getAllQuestions, getQuestionById, createQuestion, deleteQuestion, createReply, deleteReply, getRepliesByQuestionId, getQuestionsByUserId, getQuestionsByVendorId } = require('../controllers/question');
const express = require('express');
const router = express.Router();

// Question routes
router.get('/', getAllQuestions);
router.get(`/:id`, getQuestionById);
router.get(`/user/:userId`, getQuestionsByUserId);
router.get(`/vendor/:vendorId`, getQuestionsByVendorId);
router.post('/', createQuestion);
router.delete(`/:id`, deleteQuestion);

// Reply routes
router.post(`/:questionId/replies`, createReply);
router.get(`/:questionId/replies`, getRepliesByQuestionId);
router.delete(`/:questionId/replies/:replyId`, deleteReply);

module.exports = router;


