const {Video} = require('../models/video');
const {VideoItem} = require('../models/video-item');
const express = require('express');
const { User } = require('../models/user');
const { Product } = require('../models/product');
const router = express.Router();

router.get(`/`, async (req, res)=> {
    const videoList = await Video.find().populate('owner', 'name').sort({'dateCreated': -1});

    if(!videoList){
        res.status(500).json({success:false})
    }
    res.status(200).send(videoList);
})

router.get(`/:id`, async (req, res)=> {
    const video = await Video.findById(req.params.id)
    .populate('videoItems')
    .populate('owner', []) // populate only items in array
    .populate({ 
        path: 'videoItems', populate: { 
            path: 'product'}
        });

    if(!video){
        res.status(500).json({success:false})
    }
    res.send(video);
})

router.post(`/`, async (req, res) => {
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
    })

    video = await video.save();

    if(!video)
    return res.status(500).send('The video cannot be created')

    res.send(video);
})

router.put('/:id', async (req, res)=> {
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
            isFeatured: req.body.isFeatured,
        },
        { new: true}
    )

    if(!video)
    return res.status(400).send('the video cannot be update!')

    res.send(video);
})

router.delete('/:id', (req, res)=>{
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
})

router.get(`/get/videocount`, async (req, res) =>{
    const videoCount = await Video.countDocuments()

    if(!videoCount) {
        res.status(500).json({success: false})
    } 
    res.send({
        videoCount: videoCount
    });
})

module.exports = router;