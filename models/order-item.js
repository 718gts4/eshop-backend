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
    isFinal: {
        type: Boolean,
        default: false,
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


// Define a function to update isFinal to true
const updateIsFinal = async (orderItemId) => {
    try {
        const orderItem = await mongoose.model("OrderItem").findById(orderItemId);
  
        if (orderItem) {
            // Find the last orderStatus object with isCompleted set to true
            const lastCompletedStatus = orderItem.orderStatus
                .slice()
                .reverse()
                .find((status) => status.isCompleted);

            if (lastCompletedStatus) {
                const completedDate = lastCompletedStatus.date;
                const currentDate = new Date();
        
                // Calculate the difference in days
                const daysDifference = Math.ceil(
                    (currentDate - completedDate) / (1000 * 60 * 60 * 24)
                );
        
                // If 7 days have passed, update isFinal to true
                if (daysDifference >= 1) {  // change 1 to 7 !!
                    orderItem.isFinal = true;
                    await orderItem.save();
                }
            }
        }
    } catch (error) {
        console.error("Error updating isFinal:", error);
    }
};
  
// Schedule a daily job to check and update isFinal
cron.schedule('* * * * *', async () => {
    console.log('Running daily job to update isFinal...');
    const orderItems = await mongoose.model("OrderItem").find();
  
    for (const orderItem of orderItems) {
        await updateIsFinal(orderItem._id);
    }
});

exports.OrderItem = mongoose.model("OrderItem", orderItemSchema);