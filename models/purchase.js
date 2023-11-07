const mongoose = require("mongoose");

const purchaseSchema = mongoose.Schema({
    date: {
        type: Date,
        required: true,
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true,
            },
            name: String,
            quantity: Number,
            price: Number,
        },
    ],
    totalAmount: {
        type: Number,
        required: true,
    },
    payment: {
        method: String,
        transactionId: String,
        status: String,
    },
});

exports.Purchase = mongoose.model("Purchase", purchaseSchema);
