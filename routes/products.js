const { getProducts, getProduct, updateProduct, deleteProduct, getProductCount, getFeaturedProductsOfCounts, createProduct, updateGalleryImages } = require('../controllers/product');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const shortid = require('shortid');
const path = require('path');
const { requireSignin, adminMiddleware } = require('../common-middleware');

const FILE_TYPE_MAP = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg'
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const isValid = FILE_TYPE_MAP[file.mimetype];
      let uploadError = new Error('이미지 파일은 .png, .jpeg, .jpg만 가능합니다.');
      if(isValid){
        uploadError = null
      }
      cb(uploadError, path.join(path.dirname(__dirname), 'uploads'))
    },
    filename: function (req, file, cb) {
      const fileName = file.originalname.split(' ').join('-');
      cb(null, shortid.generate() + '-' + fileName)
    }
  })
  
const upload = multer({ storage })


router.get(`/`, getProducts);
router.get(`/:id`, getProduct);
router.post(`/create`, upload.single('image'), requireSignin, adminMiddleware, createProduct);
router.put('/:id', upload.single('image'), requireSignin, adminMiddleware, updateProduct);
router.put('/gallery-images/:id', upload.array('productImages'), updateGalleryImages, requireSignin, adminMiddleware);
router.delete(`/:id`, requireSignin, adminMiddleware, deleteProduct);
router.get(`/get/count`, getProductCount);

// get only the count number of featured products
router.get(`/get/featured/:count`, getFeaturedProductsOfCounts);

module.exports = router;