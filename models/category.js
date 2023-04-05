const mongoose = require('mongoose');

const categorySchema = mongoose.Schema({
    name: {
        type:String, 
        required:true,
        trim: true
    },
    slug: {
        type: String,
        required: false
    },
    icon: {
        type: String
    },
    color: {
        type: String
    },
    parentId: {
        type: String,
    }
})

exports.Category = mongoose.model('Category', categorySchema);