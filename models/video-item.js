const mongoose = require('mongoose');

const videoItemSchema = mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }
})

exports.VideoItem = mongoose.model('VideoItem', videoItemSchema);