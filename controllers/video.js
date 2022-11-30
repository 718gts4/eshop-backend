const { Video } = require('../models/video');
const { VideoItem } = require('../models/video-item');
const { User } = require('../models/user');
const { Product } = require('../models/product');

exports.getVideos = async (req, res) => {
    const videoList = await Video.find().populate('owner', 'name').sort({'dateCreated': -1});

    if(!videoList){
        res.status(500).json({success:false})
    }
    res.status(200).send(videoList);
}

exports.getVideo = async (req, res) => {
    const video = await Video.findById(req.params.id)
    .populate('videoItems')
    .populate('owner', ['name', 'email', 'phone', 'isAdmin', 'street', 'apartment', 'zip', 'city', 'country', 'image']) // populate only items in array
    .populate({ 
        path: 'videoItems', populate: { 
            path: 'product'}
        });

    if(!video){
        res.status(500).json({success:false})
    }
    res.send(video);
}

exports.postVideo = async (req, res) => {
    const owner = await User.findById(req.body.owner);     
    if(!owner) return res.status(400).send('Invalid user id');

    // populate videoItems(products) from database and attach to new Video as array of videoItemsIds
    const videoItemsIds = Promise.all(req.body.videoItems.map(async (videoItem) =>{
        let newVideoItem = new VideoItem({
            product: videoItem.product
        })

        newVideoItem = await newVideoItem.save();
        return newVideoItem._id;
    }))

    const videoItemsIdsResolved =  await videoItemsIds;

    let video = new Video({
        videoItems: videoItemsIdsResolved,
        owner: req.body.owner,
        name: req.body.name,
        description: req.body.description,
        image: req.body.image,
        videoUrl: req.body.videoUrl,
        brand: req.body.brand,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
        likes: {}
    })

    video = await video.save();

    if(!video)
    return res.status(500).send('The video cannot be created')

    res.send(video);
}

exports.updateVideo = async (req, res) => {
    const videoItemsArray = await Video.findById(req.params.id);

    const videoItemsIds = Promise.all(req.body.videoItems.map(async (videoItem) =>{
        let newVideoItem = new VideoItem({
            product: videoItem.product
        })

        newVideoItem = await newVideoItem.save();
        return newVideoItem._id;
    }))

    const videoItemsIdsResolved =  await videoItemsIds;

    const video = await Video.findByIdAndUpdate(
        req.params.id,
        {
            videoItems: videoItemsIdsResolved,
            name: req.body.name,
            description: req.body.description,
            image: req.body.image,
            videoUrl: req.body.videoUrl,
            brand: req.body.brand,
            rating: req.body.rating,
            numReviews: req.body.numReviews,
            numViews: req.body.numViews,
            isFeatured: req.body.isFeatured,
        },
        { new: true}
    )

    if(!video)
    return res.status(400).send('the video cannot be update!')

    res.send(video);
}

exports.deleteVideo = async (req, res) => {
    Video.findByIdAndRemove(req.params.id).then(async video =>{
        if(video) {
            await video.videoItems.map(async videoItem => {
                await VideoItem.findByIdAndRemove(videoItem)
            })
            return res.status(200).json({success: true, message: 'the video is deleted!'})
        } else {
            return res.status(404).json({success: false , message: "video not found!"})
        }
    }).catch(err=>{
       return res.status(500).json({success: false, error: err}) 
    })
}

exports.getVideoCount = async (req, res) => {
    const videoCount = await Video.countDocuments()

    if(!videoCount) {
        res.status(500).json({success: false})
    } 
    res.send({
        videoCount: videoCount
    });
}