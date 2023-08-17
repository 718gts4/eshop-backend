const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    orderItems: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrderItem',
        required: true
    }],
    usedPoints : {
        type: Number,
    },
    status: {
        type: String,
        required: true,
        default: '주문완료',
    },
    deliveryFee: {
        type: Number,
        default: 3000,
    },
    productPrice: {
        type: Number,
    },
    totalPrice: {
        type: Number,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
    },
    dateOrdered: {
        type: Date,
        default: Date.now,
    }, 
    orderItemsData: [{
        orderItemNumber: String,
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: Number,
        orderStatus: [
            {
                type: {
                    type: String,
                    enum: ['주문완료', '준비중', '배송중', '배송완료'],
                    required: true
                },
                date: Date,
                isCompleted: Boolean
            }
        ]
    }], 
},
{timestamps: true}
);

orderSchema.virtual('id').get(function(){
    return this._id.toHexString();
});

orderSchema.set('toJSON', {
    virtuals: true,
});

exports.Order = mongoose.model("Order", orderSchema);