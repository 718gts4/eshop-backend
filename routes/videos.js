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
    getVideosByUser
} = require('../controllers/video');
const express = require('express');
const mime = require('mime');
const router = express.Router();
const { requireSignin, adminMiddleware } = require('../common-middleware');
const { Video } = require('../models/video');
const mongoose = require('mongoose');

const { uploadVideoToS3, getVideoFile} = require('../s3')

require('dotenv/config');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const shortid = require('shortid');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const bodyParser = require('body-parser');


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
    
const upload = multer({ 
    dest: 'uploads/', 
    limits: { fileSize: 1024 * 1024 * 50 } 
});

const MAX_FILE_SIZE = 1024 * 1024 * 50; // 50 MB

router.use(bodyParser.json({ limit: '50mb' }));
router.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));


router.get(`/`, getVideos);
router.get(`/:id`, getVideo);
// router.post(`/create`, postVideo, requireSignin, adminMiddleware);
router.put('/:id', updateVideo, requireSignin, adminMiddleware);
router.patch('/:id/like', likeVideo, requireSignin);
router.delete('/:id', deleteVideo, requireSignin, adminMiddleware);
router.get(`/get/videocount`, getVideoCount);
router.put(`/:id/updatecomments`, updateVideoComment);
router.post(`/:id/followingVideos`, getFollowingVideos);
router.get(`/uservideos/:id`, getVideosByUser)

router.post("/upload/:id", upload.single('video'), async (req, res) => {
    const file = req.file;
    const userId = req.params.id;
    const Id = mongoose.Types.ObjectId(req.params.id);

    if (!file || !userId) return res.status(400).json({ message: "File or user id is not available"});

    const fileType = mime.getType(file.originalname);
    if (!fileType.startsWith('video/')) {
        fs.unlink(file.path, (err) => {
            if (err) {
                console.error(err);
            } else {
                console.log(`${file.path} was deleted`);
            }
        });
        return res.status(400).json({ message: "Invalid file type. Only video files are allowed." });
    }

    const fileInfo = await FileSystem.getInfoAsync(file.path);

    const fileSize = file.size;
    if (fileSize > MAX_FILE_SIZE) {
        fs.unlink(file.path, (err) => {
            if (err) {
                console.error(err);
            } else {
                console.log(`${file.path} was deleted`);
            }
        });
        return res.status(400).json({ message: "File size exceeded. Maximum file size is 50 MB." });
    }

    try {
        await ffmpeg.ffprobe(file.path, function (err, metadata){
            if (err) {
                fs.unlink(file.path, (err) => {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log(`${file.path} was deleted`);
                    }
                });
                return res.status(400).json({message: 'Error extracting video metadata'});
            }
            const duration = metadata.format.duration;
            if(duration > 16) {
                fs.unlink(file.path, (err) => {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log(`${file.path} was deleted`);
                    }
                });
                return res.status(400).json({message: '영상이 15초를 초과하면 안됩니다'})
            }
        });

        const key = await uploadVideoToS3({file, userId});
        if (key) {

            const video = new Video({
                videoUrl: key.key,
                createdBy: Id,
                name: req.file.filename,
            });

            const savedVideo = await video.save({new:true});

            if(!savedVideo) {
                fs.unlink(file.path, (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({message: 'An error occurred while deleting the file'});
                    }
                    console.log(`${file.path} was deleted`);
                    return res.status(500).send('The video cannot be created');
                });
            } else {
                fs.unlink(file.path, (err) => {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log(`${file.path} was deleted`);
                    }
                });

                return res.status(201).json({key});
            }
        
        }
        
    } catch (error) {
        fs.unlink(file.path, (err) => {
            if (err) {
                console.error(err);
            } else {
                console.log(`${file.path} was deleted`);
            }
        });
        return res.status(500).json({message: error.message});
    }
});


router.get("/video/:key", async (req, res) => {
    const key = req.params.key;
    const videoUrl = getVideoFile(key);
    res.send(videoUrl)
});

module.exports = router;