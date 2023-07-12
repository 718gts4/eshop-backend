const express = require('express');
const router = express.Router();
const { requireSignin } = require('../common-middleware');
const { 
    bookmarkedProduct, 
    getProductBookmarks, 
    addToBookmarkproduct, 
    removeFromBookmarkproduct 
} = require('../controllers/bookmarkproduct');

router.post(`/bookmarkedPrroduct`, requireSignin, bookmarkedProduct);
router.get(`/getProductBookmarks/`, getProductBookmarks);
router.post(`/addToBookmarkproduct`, addToBookmarkproduct);
router.delete('/:id', removeFromBookmarkproduct);

module.exports = router;