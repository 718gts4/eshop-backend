const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    title: {type: String},
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: Number, required: true },
    country: { type: String, required: true },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
}, {timestaps: true});

addressSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

addressSchema.set('toJSON', {
    virtuals: true,
});

exports.Address = mongoose.model('Address', addressSchema);

