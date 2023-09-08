const mongoose = require('mongoose');
const { Sale } = require('../models/sale'); 
const moment = require('moment-timezone');

const reviewSchema = mongoose.Schema(
    {
        rating: { type: Number, required: true },
        comment: { type: String, required: true },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
     },
    {
      timestamps: true,
    }
)

const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        default: Date.now,
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true
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
    reviews: [reviewSchema],
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
    dropDate:{
        type: Date,
        default: () => moment.tz('Asia/Seoul'),
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },   
    onSale: {
        type: Boolean,
        required: true,
        default: false
    },
    discountPrice: {
        type: Number,
    },
    discount: {
        type: Number,
        default: 0,
    },
    saleStartDate: {
        type: Date,
        get: function () {
            // Convert the saleStartDate to Seoul Timezone before returning
            return moment(this.getDataValue('saleStartDate')).tz('Asia/Seoul');
        },
    },
    saleEndDate: {
        type: Date,
        get: function () {
            // Convert the saleEndDate to Seoul Timezone before returning
            return moment(this.getDataValue('saleEndDate')).tz('Asia/Seoul');
        },
    },
    salesQuantity: {
        type: Number,
        default: 0,
    }, 
    deliveryFee: {
        type: Boolean,
        default: false
    },
    deliveryFeeAmount: {
        type: Number,
        default: 0
    }
})


productSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

productSchema.set('toJSON', {
    virtuals: true,
});

exports.Product = mongoose.model('Product', productSchema);