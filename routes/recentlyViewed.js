const { getRecentlyViewed, saveRecentlyViewed, deleteRecentlyViewed } = require('../controllers/recentlyViewed');
const express = require('express');
const router = express.Router();

router.get(`/`, getRecentlyViewed);
router.post(`/`, saveRecentlyViewed);
router.delete(`/:id`, deleteRecentlyViewed);

module.exports = router;