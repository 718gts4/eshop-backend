const mongoose = require('mongoose');

const videoSchema = mongoose.Schema({
    videoItems: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VideoItem'
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    name: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    videoUrl: {
        type: String,
        required: true
    },
    image: {
        type: String,
        default: ''
    },
    brand: {
        type: String,
        default: ''
    },
    rating: {
        type: Number,
        default: 0
    },
    numReviews: {
        type: Number,
        default: 0
    },
    numViews: {
        type: Number,
        default: 0
    },
    numComments: {
        type: Number,
        default: 0
    },
    isFeatured:{
        type: Boolean,
        default: false
    },
    likes: {
        type: Map,
        of: Boolean
    },
    bookmarks: {
        type: Map,
        of: Boolean
    },
    dateCreated:{
        type: Date,
        default: Date.now
    }
}, {timestamps: true});

videoSchema.virtual('id').get(function(){
    return this._id.toHexString();
});

videoSchema.set('toJSON', {
    virtuals: true,
});

exports.Video = mongoose.model('Video', videoSchema);