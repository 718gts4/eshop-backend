const { Bookmark } = require('../models/bookmark');

exports.bookmarked = (req, res) => {
    Bookmark.find({"videoId": req.body.videoId, "userId": req.body.userId})
    .exec((err, bookmark) => {
        if(err) return res.status(400).send(err)

        let result = false;
        if(bookmark.length !==0) {
            result = true
        }

        res.status(200).json({success: true, bookmarked: result})
    })

};

exports.getBookmarks = (req, res) => {
    Bookmark.find({"videoId": req.body.videoId})
    .exec((err, bookmark) => {
        if(err) return res.status(400).send(err)
        res.status(200).json({success: true, bookmarkCount: bookmark.length})
    })

}

exports.addToBookmark = (req, res) => {
    let bookmark = new Bookmark({
        videoId: req.body.videoId,
        userId: req.body.userId
    });

    bookmark.save((err, result) => {
        if(err) return res.json({success: false, err})
        return res.status(200).json({success:true, result})
    })
}

exports.removeFromBookmark = (req, res) => {
    Bookmark.findOneAndDelete({videoId: req.body.videoId, userId: req.body.userId})
        .exec((err, result) => {
            if(err) return res.status(400).json({success: false, err})
            res.status(200).json({success: true, result})
        })
}

exports.getBookmarkedVideos = (req, res) => {
    Bookmark.find({"userId": req.body.userId})
        .populate('userId')
        .populate('createdBy')
        .populate({
            path: 'videoId', populate: {
                path: 'createdBy'
            }
        })
        .populate({ 
            path: 'videoId', populate: { 
                path: 'videoItems', populate: {
                    path: 'product'
                }}
        })
        .exec((err, result) => {
            if (err) return res.status(400).send(err);
            return res.status(200).json({success: true, result})
        })
}

exports.getUserBookmarkCount = (req, res) => {
    Bookmark.find({"userId": req.body.userId}).countDocuments()
    .exec((err, result) => {
        if (err) return res.status(400).send(err);
        return res.status(200).json({success: true, result})
    })
}

