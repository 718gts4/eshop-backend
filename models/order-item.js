const mongoose = require('mongoose');

const orderItemSchema = mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    paidPrice: {
        type: Number,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
    },
    address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address'
    },
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    dateOrdered: {
        type: Date,
        default: Date.now,
    },  
    orderNumber: {
        type: String,
        unique: true,
        minlength: 16,
        maxlength: 16,
    }, 
    parentOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
    }, 
    orderStatus: [
        {
            type: {
                type: String,
                enum: ["주문완료", "준비중", "배송중", "배송완료"],
                default: "ordered",
            }, 
            date: {
                type: Date
            },
            isCompleted: {
                type: Boolean,
                default: false,
            },
        },
    ], 
})

exports.OrderItem = mongoose.model("OrderItem", orderItemSchema);