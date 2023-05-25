const mongoose = require('mongoose');


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
    colorOptions: [
        {
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
        }
    ],
    subOption1: {
        name: {
            type: String,
            // required: true
        },
        values: [
            {
                name: {
                    type: String,
                    // required: true
                }
            }
        ]
    },
    subOption2: {
        name: {
            type: String,
            // required: true
        },
        values: [
            {
                name: {
                    type: String,
                    required: true
                }
            }
        ]
    },
    subOption3: {
        name: {
            type: String,
            // required: true
        },
        values: [
            {
                name: {
                    type: String,
                    // required: true
                }
            }
        ]
    },
    sale: {
        type: saleSchema,
        default: null
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
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
})


productSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

productSchema.set('toJSON', {
    virtuals: true,
});

exports.Product = mongoose.model('Product', productSchema);