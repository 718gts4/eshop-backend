const express = require('express');
const router = express.Router();
const { requireSignin } = require('../common-middleware');
const { bookmarked, getBookmarks, addToBookmark, removeFromBookmark, getBookmarkedVideos } = require('../controllers/bookmark');

router.post(`/bookmarked`, requireSignin, bookmarked);
router.post(`/getBookmarkCount`, getBookmarks);
router.post(`/addToBookmark`, addToBookmark);
router.post(`/removeFromBookmark`, removeFromBookmark);
router.post(`/getBookmarkedVideos`, getBookmarkedVideos);

module.exports = router;