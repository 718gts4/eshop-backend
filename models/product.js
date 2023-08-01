const mongoose = require('mongoose');
const { Sale } = require('../models/sale');
  
const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        default: Date.now,
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
        type: String 
    }],
    brand: {
        type: String,
        default: ''
    },
    price: {
        type: Number,
        default: 0
    },
    parentCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
    },
    reviews: [
        {
            userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
            review: String
        }
    ],
    rating: {
        type: Number,
        default: 0
    },
    numReviews: {
        type: Number,
        default: 0
    },
    dropProduct: {
        type: Boolean,
        default: false
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
    bookmarks: {
        type: Map,
        of: Boolean
    },
    colorOptions: {
        productColor: {
            type: String,
            // required: true
        },   
        hexColor: {
            type: String,
        },
        sizes:[
            {
                size: {
                    type: String,
                    // required: true
                },
                stock: {
                    type: Number,
                    default: 10000
                }   
            }
        ],
    },
    subOption1: {
        title: {
            type: String,
            default: '옵션 1'
        },
        options: [
            {
                name: {
                    type: String,
                    // required: true
                },
                value : {
                    type: String,
                }
            }
        ]
    },
    subOption2: {
        title: {
            type: String,
            default: '옵션 2'
        },
        options: [
            {
                name: {
                    type: String,
                    // required: true
                },
                value : {
                    type: String,
                }
            }
        ]
    },
    subOption3: {
        title: {
            type: String,
            default: '옵션 3'
        },
        options: [
            {
                name: {
                    type: String,
                    // required: true
                },
                value : {
                    type: String,
                }
            }
        ]
    },
    delivery : {
        type: String,
        default: ''
    },
    topSeller: {
        type: Boolean,
        default: false
    },
    display: {
        type: Boolean,
        default: true
    },
    soldout: {
        type: Boolean,
        default: false
    },
    justin: {
        type: Boolean,
        default: false
    },
    saleDuration: {
        startDate: Date,
        endDate: Date,
        deliveryDate: Date
    },
    dropDate:{
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    sale: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sale',
        default: null
    },
    salesQuantity: {
        type: Number,
        default: 0,
    },
})


productSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

productSchema.set('toJSON', {
    virtuals: true,
});

exports.Product = mongoose.model('Product', productSchema);