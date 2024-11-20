const express = require('express');
const router = express.Router();

const {getQuestions, addQuestion, addAnswer} = require("../controllers/superadmin-question");

router.get('/', getQuestions);
router.post('/', addQuestion);
router.post('/:id/answers', addAnswer);

module.exports = router;