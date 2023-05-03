const { 
    getVideos, 
    getVideo, 
    postVideo, 
    updateVideo, 
    deleteVideo, 
    getVideoCount,
    likeVideo,
    updateVideoComment,
    getFollowingVideos,
    getVideosByUser,
    bookmarkVideo
} = require('../controllers/video');
const express = require('express');
const router = express.Router();
const { requireSignin, adminMiddleware } = require('../common-middleware');
const { Video } = require('../models/video');
const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

const { uploadVideoToS3, getVideoFile, uploadProfileToS3 } = require('../s3')

require('dotenv/config');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const shortid = require('shortid');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
    'video/mp4': 'mp4',
    'video/mpeg': 'mpeg',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi'
};
  
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('.mp4, .mpeg, .mov and .avi 파일만 가능합니다!');
        if(isValid){
            uploadError = null
        }
        cb(uploadError, path.join(path.dirname(__dirname), 'uploads'))
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.split(' ').join('-');
        cb(null, shortid.generate() + '-' + fileName)
    }
})
   

// const upload = multer({ 
//     dest: 'uploads/', 
//     limits: { fileSize: 1024 * 1024 * 50 } 
// });

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 50 } 
})

router.get(`/`, getVideos);
router.get(`/:id`, getVideo);
router.post(`/create`, postVideo, requireSignin, adminMiddleware);
router.put('/:id', updateVideo, requireSignin, adminMiddleware);
router.patch('/:id/like', likeVideo, requireSignin);
router.patch('/:id/bookmark', bookmarkVideo, requireSignin);
router.delete('/:id', deleteVideo, requireSignin, adminMiddleware);
router.get(`/get/videocount`, getVideoCount);
router.put(`/:id/updatecomments`, updateVideoComment);
router.post(`/:id/followingVideos`, getFollowingVideos);
router.get(`/uservideos/:id`, getVideosByUser)


const createThumbnail = async (videoPath, thumbnailPath) => {
    try {
      await ffmpeg(videoPath)
        .screenshot({
          count: 1,
          folder: path.dirname(thumbnailPath),
          filename: path.basename(thumbnailPath),
          size: '1080x1920',
        })
        .on('error', (err) => {
          console.log(`Error generating thumbnail: ${err}`);
        });
    } catch (error) {
      console.log(`Error generating thumbnail: ${error}`);
    }
  };


router.post("/upload/:id", upload.single('video'), async (req, res) => {

    const file = req.file;
    const userId = req.params.id;
    const Id = mongoose.Types.ObjectId(req.params.id);

    if (!file || !userId) {
        return res.status(400).json({ message: "File or user id is not available" });
    }

    console.log('check point 1')
    try {

        const key = await uploadVideoToS3({ file, userId });

        if (key) {
            console.log('KEY', key)
        }

        if (!key) {
            console.log('no key')
            return res.status(500).send('The video cannot be created');
        }

        console.log('videoUrl', key.key)
        console.log('createdBy', Id)
        console.log('name', req.file.filename)
        console.log('description', req.body.description)
        console.log('videoItems', req.body.videoItems)
        console.log('typeof', typeof req.body.videoItems);

        if (Array.isArray(req.body.videoItems)) {
            console.log('req.body.videoItems is an array');
          } else {
            console.log('req.body.videoItems is not an array');
          }
          
        const video = new Video({
            videoUrl: key.key,
            createdBy: Id,
            name: req.file.filename,
            description: req.body.description,
            videoItems: req.body.videoItems,
            likes: {},
            bookmarks: {},
        });

        const savedVideo = await video.save();

        console.log('saved video', savedVideo);
        return res.status(201).json({ key });

    } catch (error) {
        fs.unlink(file.path, (err) => {
            if (err) throw err;
            console.log(`${file.path} was not deleted`);
        });
        res.status(500).json({ message: error.message });
    }
});
  
router.get("/video/:key", async (req, res) => {
    const key = req.params.key;
    const videoUrl = getVideoFile(key);
    res.send(videoUrl)
});

module.exports = router;