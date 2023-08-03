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
    orderStatus: [
        {
            type: {
                type: String,
                enum: ["주문완료", "주문확인", "준비중", "배송중", "배송완료"],
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
    orderNumber: {
        type: String,
        required: true,
        unique: true,
        minlength: 16,
        maxlength: 16,
    },
 
},
{timestamps: true}
);

orderSchema.pre('save', function (next) {
    // Generate a random 16-digit number
    const randomNumber = Math.floor(1000000000000000 + Math.random() * 9000000000000000);
    this.orderNumber = randomNumber.toString(); // Convert to string and set as order number
    next();
});

orderSchema.virtual('id').get(function(){
    return this._id.toHexString();
});

orderSchema.set('toJSON', {
    virtuals: true,
});

exports.Order = mongoose.model("Order", orderSchema);