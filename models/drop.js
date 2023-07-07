const mongoose = require('mongoose');

const dropSchema = mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    dropDate:{
        type: Date,
        required: true
    },
    image: {
        type: String,
        default: ''
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },    
    dateCreated:{
        type: Date,
        default: Date.now
    },
}, {timestamps: true});

exports.Drop = mongoose.model("Drop", dropSchema);