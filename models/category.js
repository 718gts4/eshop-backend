const mongoose = require('mongoose');

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
    }
})

// categorySchema.method('toJSON', function(){
//     const { __v, ...object } = this.toObject();
//     const { _id:id, ...result } = object;
//     return { ...result, id };
// });

exports.Category = mongoose.model('Category', categorySchema);