const mongoose = require('mongoose');

const bookmarkSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    videoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video'
    },
    dateCreated:{
        type: Date,
        default: Date.now
    },
}, {timestamps: true})

bookmarkSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

bookmarkSchema.set('toJSON', {
    virtuals: true,
});

exports.Bookmark = mongoose.model('Bookmark', bookmarkSchema);