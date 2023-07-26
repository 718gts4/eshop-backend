const mongoose = require('mongoose');

const recentlyViewedSchema = mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
})

exports.RecentlyViewed = mongoose.model('RecentlyViewed', recentlyViewedSchema);