const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    detail: {
        type: String,
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    repliedByVendor: {
        type: Boolean,
        default: false
    },
    productQuestion: {
        type: Boolean,
        default: false
    },
    replies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reply'
    }],
    dateCreated: {
        type: Date,
        default: Date.now
    },
});

const replySchema = new mongoose.Schema({
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    readByUser: {
        type: Boolean,
        default: false
    },
    dateCreated: {
        type: Date,
        default: Date.now
    }
});

questionSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

questionSchema.set('toJSON', {
    virtuals: true,
});

replySchema.virtual('id').get(function () {
    return this._id.toHexString();
});

replySchema.set('toJSON', {
    virtuals: true,
});

exports.Question = mongoose.model('Question', questionSchema);
exports.Reply = mongoose.model('Reply', replySchema);
