const mongoose = require('mongoose');

const returnBankSchema = new mongoose.Schema({
    accountName: {type: String, required: true},
    accountNumber: { type: String, required: true },
    bankName: { type: String, required: true },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isDefault: {
        type: Boolean,
        default: true,
    }
}, {timestaps: true});

returnBankSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

returnBankSchema.set('toJSON', {
    virtuals: true,
});

exports.ReturnBank = mongoose.model('ReturnBank', returnBankSchema);