const mongoose = require('mongoose');
const { generalChatSchema } = require('./generalChat');

const vendorSupportQuerySchema = new mongoose.Schema({
    queryType: {
        type: String,
        enum: ['Product', 'Customer', 'Settlement', 'Order', 'Video'],
        required: true
    }
});

const VendorSupportQuery = generalChatSchema.discriminator('VendorSupportQuery', vendorSupportQuerySchema);

module.exports = mongoose.model('VendorSupportQuery');
