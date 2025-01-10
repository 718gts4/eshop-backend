const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  imp_uid: {
    type: String,
    required: true,
  },
  merchant_uid: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  buyer_name: {
    type: String,
    required: true,
  },
  buyer_email: {
    type: String,
    required: true,
  },
  buyer_tel: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['paid', 'failed'],
    default: 'failed',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Payment', PaymentSchema);
