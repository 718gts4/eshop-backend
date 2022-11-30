const { 
    getVideos, 
    getVideo, 
    postVideo, 
    updateVideo, 
    deleteVideo, 
    getVideoCount 
} = require('../controllers/video');
const express = require('express');
const router = express.Router();

router.get(`/`, getVideos);
router.get(`/:id`, getVideo);
router.post(`/create`, postVideo);
router.put('/:id', updateVideo);
router.delete('/:id', deleteVideo);
router.get(`/get/videocount`, getVideoCount);

module.exports = router;