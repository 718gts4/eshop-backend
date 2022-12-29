const express = require('express');
const router = express.Router();
const { requireSignin } = require('../common-middleware');
const { saveComment, getComments } = require('../controllers/video-comment');

router.post(`/saveComment`, requireSignin, saveComment);
router.post(`/:id`, getComments);

module.exports = router;