const mongoose = require('mongoose');

const subcategorySchema = mongoose.Schema({
    name: {
        type:String, 
        required:true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    icon: {
        type: String
    },
    color: {
        type: String
    }
});

const categorySchema = mongoose.Schema({
    name: {
        type:String, 
        required:true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    icon: {
        type: String
    },
    color: {
        type: String
    },
    subcategories: [subcategorySchema]
})

exports.Category = mongoose.model('Category', categorySchema);