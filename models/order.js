const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    name: String
})

exports.Order = mongoose.model("Order", orderSchema);