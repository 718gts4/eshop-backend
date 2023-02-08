const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    name: {type: String, required: true},
    phone: { type: Number, required: true },
    shippingAddress1: { type: String, required: true },
    shippingAddress2: { type: String },
    zip: { type: Number },
    deliveryNote: {type:String},
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isDefault: {type: Boolean}
}, {timestaps: true});

addressSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

addressSchema.set('toJSON', {
    virtuals: true,
});

exports.Address = mongoose.model('Address', addressSchema);