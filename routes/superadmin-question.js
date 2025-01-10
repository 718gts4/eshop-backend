const express = require('express');
const router = express.Router();

const {getQuestions, addQuestion, addAnswer, getQuestionsByUser, editQuestion} = require("../controllers/superadmin-question");

router.get('/', getQuestions);
router.post('/', addQuestion);
router.post('/:id/answers', addAnswer);
router.get("/user/:userId", getQuestionsByUser);
router.put(`/:questionId`, editQuestion);

module.exports = router;