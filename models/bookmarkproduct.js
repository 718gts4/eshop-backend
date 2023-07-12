const mongoose = require('mongoose');

const bookmarkproductSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    dateCreated:{
        type: Date,
        default: Date.now
    },
}, {timestamps: true})

bookmarkproductSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

bookmarkproductSchema.set('toJSON', {
    virtuals: true,
});

exports.Bookmarkproduct = mongoose.model('Bookmarkproduct', bookmarkproductSchema);