const { Question, Reply } = require("../models/question");
const mongoose = require("mongoose");
// Question Controllers

// Get all questions
exports.getAllQuestions = async (req, res) => {
    try {
        const questions = await Question.find().populate("replies");
        res.json(questions);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get a single question by ID
exports.getQuestionById = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id)
            .populate("replies")
            .populate("vendorId", ["name", "image", "_id"])
            .populate("productId", ["name", "image", "_id"]);
        if (!question) {
            return res.status(404).json({ error: "Question not found" });
        }
        res.json(question);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.getQuestionsByUserId = async (req, res) => {
    try {
        const questions = await Question.find({ userId: req.params.userId })
            .populate("replies")
            .populate("vendorId", ["brand", "image", "_id", "username"])
            .populate("productId", ["name", "image", "_id"])
            .populate("userId", ["image"])
            .sort({ dateCreated: -1 });
        res.json(questions);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.getQuestionsByVendorId = async (req, res) => {
    try {
        const questions = await Question.find({ vendorId: req.params.vendorId })
            .populate("replies")
            .populate("vendorId", ["image", "name", "username"])
            .populate("productId", ["name", "image", "_id"])
            .populate("userId", ["image", "name", "username"])
            .sort({ dateCreated: -1 });
        res.json(questions);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// Create a new question
exports.createQuestion = async (req, res) => {
    try {
        const { userId, title, detail, vendorId, productId, productQuestion } = req.body;
        const objectUserId = mongoose.Types.ObjectId(userId);
        const objectVendorId = mongoose.Types.ObjectId(vendorId);

        let questionData = {
            userId: objectUserId,
            vendorId: objectVendorId,
            title,
            detail,
            productQuestion,
            questiongType,
        };

        if (productId) {
            questionData.productId = mongoose.Types.ObjectId(productId);
        }

        const question = new Question(questionData);
        await question.save();
        res.status(201).json(question);
    } catch (error) {
        res.status(500).json({ error: error });
    }
};

// Edit a reply by ID
exports.editQuestion = async (req, res) => {
    const { questionId } = req.params;
    const { repliedByVendor } = req.body;
    try {
        const question = await Question.findByIdAndUpdate(
            questionId,
            { repliedByVendor: repliedByVendor },
            { new: true }
        );
        if (!question) {
            return res.status(404).json({ error: "Question not found" });
        }

        await question.save();
        res.json(question);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// Delete a question by ID
exports.deleteQuestion = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) {
            return res.status(404).json({ error: "Question not found" });
        }
        await Reply.deleteMany({ questionId: req.params.id });
        await question.remove();
        res.json({ message: "Question deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// Reply Controllers
// Create a new reply for a question
exports.createReply = async (req, res) => {
    try {
        const { questionId, userId, vendorId, content } = req.body;
        const question = await Question.findById(questionId);
        if (!question) {
            return res.status(404).json({ error: "질문을 찾을 수 없습니다" });
        }
        const reply = new Reply({ questionId, userId, vendorId, content });
        await reply.save();
        question.replies.push(reply._id);
        await question.save();
        res.status(201).json(reply);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// Edit a reply by ID
exports.editReply = async (req, res) => {
    const { replyId } = req.params;
    const { readByUser } = req.body;

    try {
        const reply = await Reply.findByIdAndUpdate(
            replyId,
            { readByUser: true },
            { new: true }
        );
        if (!reply) {
            return res.status(404).json({ error: "Reply not found" });
        }

        await reply.save();
        res.json(reply);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.updateDefaultCard = async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;

    try {
        await Card.updateMany(
            { userId: userId },
            { $set: { isDefault: false } }
        );
        const updatedCard = await Card.findByIdAndUpdate(
            id,
            { $set: { isDefault: true } },
            { new: true }
        );
        res.send(updatedCard);
    } catch (error) {
        res.status(400).send(error);
    }
};

// Delete a reply by ID
exports.deleteReply = async (req, res) => {
    try {
        const reply = await Reply.findById(req.params.replyId);
        if (!reply) {
            return res.status(404).json({ error: "Reply not found" });
        }
        const question = await Question.findById(reply.questionId);
        if (!question) {
            return res.status(404).json({ error: "Question not found" });
        }
        question.replies = question.replies.filter(
            (id) => id.toString() !== reply._id.toString()
        );
        await question.save();
        await reply.remove();
        res.json({ message: "Reply deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get all replies for a question
exports.getRepliesByQuestionId = async (req, res) => {
    try {
        const replies = await Reply.find({ questionId: req.params.questionId });
        res.json(replies);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get all replies for a user
exports.getRepliesByUserId = async (req, res) => {
    try {
        const replies = await Reply.find({ userId: req.params.userId });
        res.json(replies);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};
