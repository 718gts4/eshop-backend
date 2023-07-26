const { getRecentlyViewed, saveRecentlyViewed } = require('../controllers/recentlyViewed');
const express = require('express');
const router = express.Router();

router.get(`/`, getRecentlyViewed);
router.post(`/`, saveRecentlyViewed);
// router.delete(`/:id`, deleteCategory);

module.exports = router;