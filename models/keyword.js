const mongoose = require('mongoose');

const keywordSchema = mongoose.Schema({
    keyword: {
        type: String,
        required: true,
        unique: true,
    },   
    dateCreated:{
        type: Date,
        default: Date.now
    },
}, {timestamps: true});

exports.Keyword = mongoose.model("Keyword", keywordSchema);