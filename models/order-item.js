const mongoose = require('mongoose');

const orderItemSchema = mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    paidPrice: {
        type: Number,
        default: 0
    },
    deliveryFeeAmount: {
        type: Number,
        default: 0
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
                enum: ["결제완료", "준비중", "배송중", "배송완료"],
                default: "결제완료",
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
    selectedColor: {
        type: String,
        default: '',
    },
    selectedSize: {
        type: String,
        default: '',
    },
    subOption1: {
        type: String,
        default: '',
    },
    subOption2: {
        type: String,
        default: '',
    },
    subOption3: {
        type: String,
        default: '',
    },
})

// Pre-save middleware to update the date when isCompleted turns true
orderItemSchema.pre('save', function (next) {
    const orderStatus = this.orderStatus;
  
    // Check if isCompleted is true in the last orderStatus object
    if (orderStatus.length > 0 && orderStatus[orderStatus.length - 1].isCompleted) {
        // Update the date property to Date.now()
        orderStatus[orderStatus.length - 1].date = Date.now();
    }
  
    // Continue with the save operation
    next();
});

exports.OrderItem = mongoose.model("OrderItem", orderItemSchema);