const mongoose = require('mongoose');

const orderItemSchema = mongoose.Schema({
    quantity: {
        type: Number,
        required: true,
        default: 1
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address'
    }
})

exports.OrderItem = mongoose.model("OrderItem", orderItemSchema);