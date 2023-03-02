const mongoose = require('mongoose');

const optionValueSchema = new mongoose.Schema({
    value: {
        type: String,
        required: true
    },
    stock: {
        type: Number,
        required: true,
        default: 0
    }  
});

const optionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    values: {
        type: [optionValueSchema],
        required: true
    }
});

const saleSchema = new mongoose.Schema({
    discount: {
        type: Number,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    }
});
  
const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    richDescription: {
        type: String,
        default: '', 
        trim: true
    },
    image: {
        type: String,
        default: ''
    },
    productImages: [{
        img: { type: Object }
    }],
    brand: {
        type: String,
        default: ''
    },
    price: {
        type: Number,
        default: 0
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviews: [
        {
            userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
            review: String
        }
    ],
    countInStock: {
        type: Number,
        min: 0,
        max: 255
    },
    rating: {
        type: Number,
        default: 0
    },
    numReviews: {
        type: Number,
        default: 0
    },
    isFeatured:{
        type: Boolean,
        default: false
    },
    dateCreated:{
        type: Date,
        default: Date.now
    },
    likes: {
        type: Map,
        of: Boolean
    },
    options: {
        type: [optionSchema],
    },
    sale: {
        type: saleSchema,
        default: null
    },
    delivery : {
        type: String,
        default: ''
    }
})

productSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

productSchema.set('toJSON', {
    virtuals: true,
});

exports.Product = mongoose.model('Product', productSchema);