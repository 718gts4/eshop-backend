const { Bookmarkproduct } = require('../models/bookmarkproduct');

exports.bookmarkedProduct = (req, res) => {
    Bookmarkproduct.find({"productId": req.body.productId, "userId": req.body.userId})
    .exec((err, bookmarkproduct) => {
        if(err) return res.status(400).send(err)

        let result = false;
        if(bookmarkproduct.length !==0) {
            result = true
        }

        res.status(200).json({success: true, bookmarkedProduct: result})
    })
};

exports.getProductBookmarks = (req, res) => {
    Bookmarkproduct.find({"productId": req.body.productId})
    .exec((err, bookmarkproduct) => {
        if(err) return res.status(400).send(err)
        res.status(200).json({success: true, bookmarkproductCount: bookmarkproduct.length})
    })
}

exports.addToBookmarkproduct = (req, res) => {
    let bookmarkproduct = new Bookmarkproduct({
        productId: req.body.productId,
        userId: req.body.userId
    });

    bookmarkproduct.save((err, result) => {
        if(err) return res.json({success: false, err})
        return res.status(200).json({success:true, result})
    })
}

exports.removeFromBookmarkproduct = (req, res) => {
    Bookmarkproduct.findOneAndDelete({productId: req.body.productId, userId: req.body.userId})
        .exec((err, result) => {
            if(err) return res.status(400).json({success: false, err})
            res.status(200).json({success: true, result})
        })
}