const SuperAdminQuestion = require("../models/superadmin-question");

// Fetch all questions
exports.getQuestions = async (req, res) => {
    try {
        const questions = await SuperAdminQuestion.find();
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: "Error fetching questions", error });
    }
};
  
// Add a new question
exports.addQuestion = async (req, res) => {
    try {
        const newQuestion = new SuperAdminQuestion({ question: req.body.question });
        await newQuestion.save();
        res.json(newQuestion);
    } catch (error) {
        res.status(500).json({ message: "Error adding question", error });
    }
};
  
// Add an answer to a question
exports.addAnswer = async (req, res) => {
    try {
        const question = await SuperAdminQuestion.findById(req.params.id);
        if (!question) {
            return res.status(404).json({ message: "Question not found" });
        }
        question.answers.push({ text: req.body.text });
        await question.save();
        res.json(question);
    } catch (error) {
        res.status(500).json({ message: "Error adding answer", error });
    }
};