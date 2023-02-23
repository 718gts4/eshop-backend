const mongoose = require('mongoose');
const crypto = require('crypto');

// const encryptionKey = process.env.ENCRYPTIONKEY;

const cardSchema = new mongoose.Schema({
    name: {type: String},
    cardNumber: { type: Object, required: true },
    expDateMonth: { type: Object, required: true },
    expDateYear: { type: Object, required: true },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isDefault: {type: Boolean}
}, {timestaps: true});


exports.Card = mongoose.model('Card', cardSchema);
