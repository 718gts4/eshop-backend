const mongoose = require('mongoose');
const cron = require('node-cron');

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
                type: Date,
                default: Date.now,
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
    isFinal: {
        type: Boolean,
        default: false,
    },
    isCanceled: {
        type: Boolean,
        default: false,
    },
})

// Pre-save middleware to update the date when isCompleted changes to true
orderItemSchema.pre('save', function(next) {
    const orderStatus = this.orderStatus;
    const lastOrderStatus = orderStatus[orderStatus.length - 1];

    // Check if isCompleted changed to true
    if (lastOrderStatus.isCompleted && this.isModified('orderStatus')) {
        // Update the date property to Date.now()
        lastOrderStatus.date = Date.now();
    }

    // Continue with the save operation
    next();
});


// Function to update isFinal field of order items
const updateIsFinal = async () => {
    try {
        // Query order items from the database
        const orderItems = await OrderItem.find();

        // Iterate through each order item
        for (const orderItem of orderItems) {
            // Check if orderStatus[3].isCompleted is true
            if (orderItem.orderStatus.length >= 4 && orderItem.orderStatus[3].isCompleted) {
                // Calculate 7 days after orderStatus[3].date
                const completedDate = new Date(orderItem.orderStatus[3].date);
                const sevenDaysLater = new Date(completedDate.getTime() + ( 1000));
                                                                        // add 7 * 24 * 60  * 60 after testing
                // Check if 7 days have passed
                if (new Date() >= sevenDaysLater) {
                    // Update isFinal field to true
                    orderItem.isFinal = true;

                    // Save the updated order item
                    await orderItem.save();
                }
            }
        }
    } catch (error) {
        console.error('Error updating isFinal:', error);
    }
};
  
// Schedule the function to run daily
cron.schedule('0 0 * * *', async () => {
    console.log('Running daily job to update isFinal...');
    await updateIsFinal();
});

exports.OrderItem = mongoose.model("OrderItem", orderItemSchema);