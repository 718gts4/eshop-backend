const mongoose = require('mongoose');

const dropSchema = mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    dropDate:{
        type: Date,
        required: true
    },
})

exports.Drop = mongoose.model("OrderItem", dropSchema);