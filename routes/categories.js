const { getCategory, getCategoryId, postCategory, updateCategory, deleteCategory } = require('../controllers/category');
const express = require('express');
const router = express.Router();
const { requireSignin, adminMiddleware } = require('../common-middleware');

router.get(`/`, getCategory);
router.get('/:id', getCategoryId);
router.post(`/`, requireSignin, adminMiddleware, postCategory);
router.put('/:id', updateCategory);
router.delete(`/:id`, deleteCategory);

module.exports = router;