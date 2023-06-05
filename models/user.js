const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        default: ''
    },
    image: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        unique: true,
        required: true,
    },
    username: {
        type: String,
        unique:true,
    },
    passwordHash: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        default: ''
    },
    gender: {
        type: String,
        default: 'none'
    },
    birthday: {
        type: String,
        default: ''
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    link: {
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

userSchema.pre('save', function (next) {
    if (!this.username) {
      this.username = this.email;
    }
    next();
});

userSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

userSchema.set('toJSON', {
    virtuals: true,
});


exports.User = mongoose.model('User', userSchema);
exports.userSchema = userSchema;