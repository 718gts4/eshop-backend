const {VideoComment} = require('../models/video-comment');


exports.saveComment = (req, res) => {

    const videoComment = new VideoComment(req.body) 

    videoComment.save((err, comment ) => {
        if(err) return res.json({ success:false, err})

        VideoComment.find({ '_id': comment._id })
        .populate('writer', ['name', 'image', 'username'])
        .exec((err, result) => {
            if(err) return res.json({ success:false, err })
            return res.status(200).json({ success:true, result })
        })

    })
}

exports.getComments = async (req, res) => {
    const comments = await VideoComment.find({postId:req.params.id})
    .populate("writer", ["name", "username", "image"]);

    if(!comments){
        res.status(500).json({success:false});
    }
    res.send(comments);

}

