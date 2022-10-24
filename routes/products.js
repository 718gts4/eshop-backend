const { getProducts, getProduct, postProduct, updateProduct, deleteProduct, getProductCount, getFeaturedProductsOfCounts } = require('../controllers/product');
const express = require('express');
const router = express.Router();
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/uploads')
    },
    filename: function (req, file, cb) {
      const fileName = file.originalname.split(' ').join('-')
      cb(null, fileName + '-' + Date.now())
    }
  })
  
const uploadOptions = multer({ storage: storage })

router.get(`/`, getProducts);
router.get(`/:id`, getProduct);
router.post(`/`, uploadOptions.single('image'), postProduct);
router.put('/:id', updateProduct);
router.delete(`/:id`, deleteProduct);
router.get(`/get/count`, getProductCount);

// get only the count number of featured products
router.get(`/get/featured/:count`, getFeaturedProductsOfCounts);

module.exports = router;