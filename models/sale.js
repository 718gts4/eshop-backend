const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
    onSale: {
        type: Boolean,
        required: true,
        default: false
    },
    title: {
        type: String,
        default: ''
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    }],
    discount: {
        type: Number,
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true
    }
});

saleSchema.pre('save', function (next) {
    const currentTime = new Date();
    if (this.endTime < currentTime) {
        this.onSale = false;
    }
    next();
}); 

saleSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

saleSchema.set('toJSON', {
    virtuals: true,
}); 

exports.Sale = mongoose.model('Sale', saleSchema);