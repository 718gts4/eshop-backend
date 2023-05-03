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
        // const metadata = await new Promise((resolve, reject) => {
        //     ffmpeg.ffprobe(file.path, (err, metadata) => {
        //         if (err) {
        //             console.log('ffmpeg error', err)
        //             reject(err);
        //         } else {
        //             console.log('metadata', metadata)
        //             resolve(metadata);
        //         }
        //     });
        // });
        // console.log('check 2')
        // const duration = metadata.format.duration;
        // if (duration > 16) {
        //     return res.status(400).json({message: '영상이 15초를 초과하면 안됩니다'})
        // }

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

        const video = new Video({
            videoUrl: key.key,
            createdBy: Id,
            name: req.file.filename,
            description: req.body.description,
            videoItems: [...req.body.videoItems],
            likes: {},
            bookmarks: {},
        });

        const savedVideo = await video.save();
        // if(!savedVideo) {
        //     return res.status(400).send('영상을 업로드할 수 없습니다.')
        // }
        console.log('saved video', savedVideo);
        return res.status(201).json({ key });
        // if (!savedVideo) {
        //     fs.unlink(file.path, (err) => {
        //     if (err) {
        //         console.log('unlinking error',err)
        //         return res.status(500).json({ message: '영상 업로드에 문제가 발생했습니다' })
        //     }
        //     console.log(`${file.path} was not deleted`);

        //     return res.status(500).send('The video cannot be created')
        //     });
        // } else {
        //     fs.unlink(file.path, (err) => {
        //     if (err) {
        //         console.log('err', err);
        //     } else {
        //         console.log(`${file.path} was deleted`);
        //     }
        //     });

        //     return res.status(201).json({ key });
        // }
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