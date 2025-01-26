const express = require('express');
const router = express.Router();
const {getQuestions, addQuestion, addAnswer, getQuestionsByUser, editQuestion, getQuestionById} = require("../controllers/superadmin-question");

// TODO: add below security
// const { requireSignin, adminMiddleware, superAdminMiddleware } = require('../common-middleware');

router.get('/', getQuestions);
router.get('/:id', getQuestionById); 
router.post('/', addQuestion);
router.post('/:id/answers', addAnswer);
router.get("/user/:userId", getQuestionsByUser);
router.put(`/:questionId`, editQuestion);

module.exports = router;