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
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['취소완료','취소요청', '취소진행중', '환불', '취소불가', '취소확인'],
        default: '삭제'
    },
    vendorRequest: {
        type: Boolean,
        default: false,
    },
    approved: {
        type: Boolean,
        default: false,
    },
    reasonForCancellation: String,
    refundAmount: Number,
    dateCreated:{
        type: Date,
        default: Date.now
    },
}, {timestamps: true})

exports.CanceledOrder = mongoose.model('CanceledOrder', canceledOrderSchema);