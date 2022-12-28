const mongoose = require('mongoose');

const videoCommentSchema = mongoose.Schema({
    writer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: ""
    },
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video'
    },
    responseTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    content: {
        type: String
    },
    dateCreated:{
        type: Date,
        default: Date.now
    },
}, {timestamps: true})

videoCommentSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

videoCommentSchema.set('toJSON', {
    virtuals: true,
});

exports.VideoComment = mongoose.model('VideoComment', videoCommentSchema);