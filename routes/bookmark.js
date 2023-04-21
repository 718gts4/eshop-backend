const express = require('express');
const router = express.Router();
const { requireSignin } = require('../common-middleware');
const { bookmarked, getBookmarks, addToBookmark, removeFromBookmark, getBookmarkedVideos, getUserBookmarkCount } = require('../controllers/bookmark');

router.post(`/bookmarked`, requireSignin, bookmarked);
router.post(`/getBookmarkCount`, getBookmarks);
router.post(`/addToBookmark`, addToBookmark);
router.post(`/removeFromBookmark`, removeFromBookmark);
router.post(`/getBookmarkedVideos/:id`, getBookmarkedVideos);
router.post(`/getUserBookmarkCount`, getUserBookmarkCount);

module.exports = router;