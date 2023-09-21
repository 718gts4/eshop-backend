const mongoose = require('mongoose');

const canceledOrderSchema = mongoose.Schema({
    orderItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    canceledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['삭제', '취소', '교환', '반품', '환불'],
        default: '삭제'
    },
    reasonForCancellation: String,
    refundAmount: Number,
    dateCreated:{
        type: Date,
        default: Date.now
    },
}, {timestamps: true})

exports.CanceledOrder = mongoose.model('CanceledOrder', canceledOrderSchema);