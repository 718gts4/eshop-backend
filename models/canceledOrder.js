const mongoose = require('mongoose');

const canceledOrderSchema = mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    canceledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    cancellationDate: Date,
    reasonForCancellation: String,
    refundAmount: Number,
    dateCreated:{
        type: Date,
        default: Date.now
    },
}, {timestamps: true})

exports.CanceledOrder = mongoose.model('CanceledOrder', canceledOrderSchema);