const { Question, Reply } = require('../models/question');

// Question Controllers

// Get all questions
const getAllQuestions = async (req, res) => {
  try {
    const questions = await Question.find().populate('replies');
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get a single question by ID
const getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id).populate('replies');
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.json(question);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new question
const createQuestion = async (req, res) => {
  try {
    const { userId, title, detail, vendorId } = req.body;
    let productId = null;
    if (req.body.productId){
        productId = req.body.productId;
    };

    const question = new Question({ userId, title, detail, vendorId, productId });
    await question.save();
    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a question by ID
const deleteQuestion = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }
        await Reply.deleteMany({ questionId: req.params.id });
        await question.remove();
        res.json({ message: 'Question deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Reply Controllers
// Create a new reply for a question
const createReply = async (req, res) => {
  try {
    const { questionId, userId, vendorId, content } = req.body;
    const question = await Question.findById(questionId);
    if (!question) {
        return res.status(404).json({ error: '질문을 찾을 수 없습니다' });
    }
    const reply = new Reply({ questionId, userId, vendorId, content });
    await reply.save();
    question.replies.push(reply._id);
    await question.save();
    res.status(201).json(reply);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a reply by ID
const deleteReply = async (req, res) => {
    try {
        const reply = await Reply.findById(req.params.replyId);
        if (!reply) {
            return res.status(404).json({ error: 'Reply not found' });
        }
        const question = await Question.findById(reply.questionId);
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }
        question.replies = question.replies.filter((id) => id.toString() !== reply._id.toString());
        await question.save();
        await reply.remove();
        res.json({ message: 'Reply deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get a single reply by ID
const getReplyById = async (req, res) => {
    try {
        const reply = await Reply.findById(req.params.replyId);
        if (!reply) {
            return res.status(404).json({ error: 'Reply not found' });
        }
        res.json(reply);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
  };
  

module.exports = { getAllQuestions, getQuestionById, createQuestion, deleteQuestion, createReply, deleteReply, getReplyById };
