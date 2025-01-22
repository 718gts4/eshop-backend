const mongoose = require('mongoose');


const popupSchema = new mongoose.Schema({
    image: {type: String},
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isDefault: {type: Boolean}
}, {timestaps: true});


exports.Popup = mongoose.model('Popup', popupSchema);
