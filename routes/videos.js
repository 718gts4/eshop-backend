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
const router = express.Router();
const { requireSignin, adminMiddleware } = require('../common-middleware');

const { uploadVideoToS3, } = require('../s3')

require('dotenv/config');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const shortid = require('shortid');
const path = require('path');

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
    
const upload = multer({ storage })


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

router.post("/create", upload.single('video'), async (req, res) => {
    const video = req.file;
    const userId = req.params.id;

    if (!video || !userId) return res.status(400).json({ message: "File or user id is not available"});

    try {
        const key = await uploadVideoToS3({video, userId});
        if (key) {
            const updateUser = await User.findByIdAndUpdate(
                userId,
                { videoUrl: key.key },
                { new: true}
            );   
        
            return res.status(201).json({key});
        }
        
    } catch (error) {
        return res.status(500).json({message: error.message});
    }
});

module.exports = router;