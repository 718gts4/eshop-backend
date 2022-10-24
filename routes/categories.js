const { getCategory, getCategoryId, postCategory, updateCategory, deleteCategory } = require('../controllers/category');
const express = require('express');
const router = express.Router();

router.get(`/`, getCategory);

router.get('/:id', getCategoryId);

router.post(`/`, postCategory);

router.put('/:id', updateCategory);

router.delete(`/:id`, deleteCategory);

module.exports = router;