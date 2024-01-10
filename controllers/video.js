const { Video } = require("../models/video");
const { VideoItem } = require("../models/video-item");
const { User } = require("../models/user");
const { Product } = require("../models/product");
const { deleteUrl } = require("../s3");

exports.getVideos = async (req, res) => {
    let limit = 10;
    let skip = parseInt(req.query.skip) || 0;

    const videoList = await Video.find()
        .populate("createdBy")
        .populate("videoItems")
        .sort({ dateCreated: -1 })
        .skip(skip)
        .limit(limit);

    if (!videoList) {
        res.status(500).json({ success: false });
    }

    res.status(200).send(videoList);
};

exports.getVideosByUser = async (req, res) => {
    try {
        const userId = req.params.userId; // assuming userId is passed as a parameter in the request

        // Find all videos created by the user
        const videos = await Video.find({ createdBy: userId });

        // Check if any videos are found
        if (!videos || videos.length === 0) {
            return res
                .status(404)
                .json({ message: "No videos found for the user." });
        }

        // If videos are found, return them in the response
        return res.status(200).json({ videos });
    } catch (error) {
        // Handle any errors that may occur
        console.error("Error fetching videos:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.getFollowingVideos = async (req, res) => {
    let limit = 10;
    let skip = parseInt(req.query.skip) || 0;

    let videos = [];
    const followingVideos = await Promise.all(
        req.body.following.map(async (video) => {
            const followingVideo = await Video.find({ createdBy: video })
                .populate("createdBy")
                .populate("videoItems")
                .sort({ dateCreated: -1 })
                .skip(skip)
                .limit(limit);

            const allVideos = videos.push(...followingVideo);
            return allVideos;
        })
    );

    if (!followingVideos) {
        res.status(500).json({ success: false });
    }
    res.status(200).send(videos);
};

exports.getVideo = async (req, res) => {
    const video = await Video.findById(req.params.id)
        .populate("videoItems")
        .populate("createdBy", [
            "name",
            "email",
            "phone",
            "isAdmin",
            "image",
            "username",
            "numComments",
        ]); // populate only items in array

    if (!video) {
        res.status(500).json({ success: false });
    }
    res.send(video);
};

exports.getVideosByUser = async (req, res) => {
    let limit = 12;
    let skip = parseInt(req.query.skip);

    const videoList = await Video.find({ createdBy: req.params.id })
        .populate("createdBy")
        .populate({
            path: "videoItems",
        })
        .sort({ dateCreated: -1 })
        .skip(skip)
        .limit(limit);

    if (!videoList) {
        res.status(500).json({ success: false });
    }
    res.status(200).send(videoList);
};

exports.postVideo = async (req, res) => {
    let video = new Video({
        videoItems: req.body.videoItems,
        createdBy: req.body.createdBy,
        name: req.body.name,
        description: req.body.description,
        image: req.body.image,
        videoUrl: req.body.videoUrl,
        brand: req.body.brand,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
        bookmarks: {},
        likes: {},
    });

    video = await video.save();

    if (!video) return res.status(500).send("The video cannot be created");

    res.send(video);
};

exports.updateVideo = async (req, res) => {
    const videoToUpdate = await Video.findById(req.params.id);
    if (!videoToUpdate) return res.status(400).send("Invalid Video!");

    const videoItemsIds = Promise.all(
        req.body.videoItems.map(async (videoItem) => {
            let newVideoItem = new VideoItem({
                product: videoItem.product,
            });

            newVideoItem = await newVideoItem.save();
            return newVideoItem._id;
        })
    );

    const videoItemsIdsResolved = await videoItemsIds;

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
            numComments: req.body.numComments,
            isFeatured: req.body.isFeatured,
            likes: req.body.likes,
            bookmarks: req.body.bookmarks,
        },
        { new: true }
    );

    if (!video) return res.status(400).send("the video cannot be update!");

    res.send(video);
};

exports.likeVideo = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        const video = await Video.findById(id);
        const isLiked = video.likes.get(userId);

        if (isLiked) {
            video.likes.delete(userId);
        } else {
            video.likes.set(userId, true);
        }

        const updatedVideo = await Video.findByIdAndUpdate(
            id,
            { likes: video.likes },
            { new: true }
        );

        res.status(200).json(updatedVideo);
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};

exports.bookmarkVideo = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        const video = await Video.findById(id);
        const bookmarks = video.bookmarks || new Map();
        const isBookmarked = bookmarks?.get(userId);

        if (isBookmarked) {
            bookmarks.delete(userId);
        } else {
            bookmarks.set(userId, true);
        }

        const updatedVideo = await Video.findByIdAndUpdate(
            id,
            { bookmarks: bookmarks },
            { new: true }
        );

        res.status(200).json(updatedVideo);
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};

exports.updateVideoComment = async (req, res) => {
    try {
        const { id } = req.params;
        // const video = await Video.findById(id);
        const numComments = req.body.numComments;

        const updatedVideo = await Video.findByIdAndUpdate(
            id,
            { numComments: numComments },
            { new: true }
        );
        res.status(200).json(updatedVideo);
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};

exports.deleteVideo = async (req, res) => {
    Video.findByIdAndRemove(req.params.id)
        .then((video) => {
            if (video) {
                deleteUrl(video.videoUrl);
                deleteUrl(video.image);
                return res
                    .status(200)
                    .json({ success: true, message: "the video is deleted!" });
            } else {
                return res
                    .status(404)
                    .json({ success: false, message: "video not found!" });
            }
        })
        .catch((err) => {
            return res.status(500).json({ success: false, error: err });
        });
};

exports.getVideoCount = async (req, res) => {
    const videoCount = await Video.countDocuments();

    if (!videoCount) {
        res.status(500).json({ success: false });
    }
    res.send({
        videoCount: videoCount,
    });
};
