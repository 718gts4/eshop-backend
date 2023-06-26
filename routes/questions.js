const { getAllQuestions, getQuestionById, createQuestion, deleteQuestion, createReply, deleteReply, getRepliesByQuestionId, getQuestionsByUserId, getQuestionsByVendorId, editReply, getRepliesByUserId, editQuestion } = require('../controllers/question');
const express = require('express');
const router = express.Router();

// Question routes
router.get('/', getAllQuestions);
router.get(`/:id`, getQuestionById);
router.get(`/user/:userId`, getQuestionsByUserId);
router.get(`/vendor/:vendorId`, getQuestionsByVendorId);
router.post('/', createQuestion);
router.delete(`/:id`, deleteQuestion);
router.put(`/:questionId`, editQuestion);

// Reply routes
router.post(`/:questionId/replies`, createReply);
router.get(`/:questionId/replies`, getRepliesByQuestionId);
router.get(`/:userId/repliesToUser`, getRepliesByUserId);
router.put(`/replies/:replyId`, editReply);
router.delete(`/:questionId/replies/:replyId`, deleteReply);

module.exports = router;


