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
    street: {
        type: String,
        default: ''
    },
    apartment: {
        type: String,
        default: ''
    },
    zip: {
        type: String,
        default: ''
    },
    city: {
        type: String,
        default: ''
    },
    country: {
        type: String,
        default: ''
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
    savedVideos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video'
    }],
    savedProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    videos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video'
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