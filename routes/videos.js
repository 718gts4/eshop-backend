const { 
    getVideos, 
    getVideo, 
    postVideo, 
    updateVideo, 
    deleteVideo, 
    getVideoCount,
    likeVideo
} = require('../controllers/video');
const express = require('express');
const router = express.Router();
const { requireSignin, adminMiddleware } = require('../common-middleware');

router.get(`/`, getVideos);
router.get(`/:id`, getVideo);
router.post(`/create`, postVideo, requireSignin, adminMiddleware);
router.put('/:id', updateVideo, requireSignin, adminMiddleware);
router.patch('/:id/like', likeVideo, requireSignin);
router.delete('/:id', deleteVideo, requireSignin, adminMiddleware);
router.get(`/get/videocount`, getVideoCount);

module.exports = router;