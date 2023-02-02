const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        default: ''
    },
    passwordHash: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    image: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    brand: {
        type: String,
        default: ''
    },
    brandDescription: {
        type: String,
        default: ''
    },
    likes: {
        type: Map,
        of: Boolean
    },
    savedVideos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video'
    }],
    savedProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    followers: {
        type: Map,
        of: Boolean
    },   
    following: {
        type: Map,
        of: Boolean
    },   
    videos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video'
    }],
    adresses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address'
    }],
});

userSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

userSchema.set('toJSON', {
    virtuals: true,
});


exports.User = mongoose.model('User', userSchema);
exports.userSchema = userSchema;