const { getProducts, 
    getProduct, 
    updateProduct, 
    deleteProduct, 
    getProductCount, 
    getFeaturedProductsOfCounts, 
    createProduct, 
    updateGalleryImages,
    getAdminProducts,
    likeProduct,
    editSaleDuration,
    getProductsByDropProducts,
    getSearchProducts,
    getRecentProducts,
    getProductsByCategoryId,
    bookmarkProduct,
    getProductsByChildCategoryId,
    createSaleProduct,
    getSaleProducts,
} = require('../controllers/product');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const shortid = require('shortid');
const path = require('path');
const { requireSignin, adminMiddleware } = require('../common-middleware');
const { uploadProductImageToS3, getProductImageFile, deleteProductUrl } = require('../s3');
const {Product} = require('../models/product');
const {Category} = require('../models/category');

const fs = require('fs');

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
              
      const uploadsFolder = path.join(path.dirname(__dirname), 'uploads');
      if (!fs.existsSync(uploadsFolder)) {
          fs.mkdirSync(uploadsFolder);
      }
    
      cb(uploadError, uploadsFolder);

    },
    filename: function (req, file, cb) {
      const fileName = file.originalname.split(' ').join('-');
      cb(null, shortid.generate() + '-' + fileName)
    }
})
  
const upload = multer({ storage })


router.get(`/`, getProducts);
router.get(`/:id`, getProduct);
router.get(`/get/drop`, getProductsByDropProducts);
router.put(`/:id`, upload.single('image'), requireSignin, adminMiddleware, updateProduct);
router.put(`/gallery-images/:id`, upload.array('productImages', 10), updateGalleryImages, requireSignin, adminMiddleware);
router.delete(`/:id`, requireSignin, adminMiddleware, deleteProduct);
router.get(`/get/count`, getProductCount);
router.get(`/admin/:id`, getAdminProducts);
router.get(`/search/products`, getSearchProducts); // get products of search result
router.patch('/:id/like', likeProduct, requireSignin);
router.patch('/:id/bookmark', bookmarkProduct, requireSignin);
router.put('/:id/sale', editSaleDuration, requireSignin);
router.get('/recent/products', getRecentProducts);
router.get('/category/:categoryId', getProductsByCategoryId);
router.get('/category/child/:categoryId', getProductsByChildCategoryId); // get child category search results

router.post('/create-sale', createSaleProduct);
router.get('/sale-products', getSaleProducts);

router.post(`/create`, upload.array("image", 5), requireSignin, adminMiddleware, async (req, res) => {
    const {
        name, price, description, richDescription, brand, parentCategory, category, isFeatured, colorOptions, subOption1, subOption2, subOption3, soldout, display, dropDate, sale, dropProduct, deliveryFee, deliveryCost, sellerId
    } = req.body;

    try {
        const images = req.files.map((file) => ({
            file: fs.readFileSync(file.path),
        }));

        const imageUploadPromises = images.map((image) => uploadProductImageToS3(image));

        const uploadedImages = await Promise.all(imageUploadPromises);

        const imageUrls = uploadedImages.map((result) => result.key);

        let product = new Product({
            name,
            description,
            richDescription,
            productImages: imageUrls,
            image: imageUrls[0],
            brand,
            price,
            parentCategory,
            category,
            isFeatured,
            createdBy: req.user.userId, // user data from middleware
            likes: {},
            bookmarks: {},
            colorOptions: JSON.parse(colorOptions),
            subOption1: JSON.parse(subOption1) || null,
            subOption2: JSON.parse(subOption2) || null,
            subOption3: JSON.parse(subOption3) || null,
            sale: sale || null,
            soldout: soldout || false,
            display: display || true,
            dropDate,
            dropProduct,
            deliveryFee,
            deliveryFeeAmount: deliveryCost,
            sellerId,
        });

        if (product.sale) {
            const endTime = new Date(req.body.sale.endTime);
            const currentTime = new Date();
            if (endTime <= currentTime) {
                return res.status(400).json({ message: 'Sale이 마감되었습니다' });
            }
            product.sale.endTime = endTime;
        }
    
        product = await product.save();
    
        if (!product) {
            return res.status(500).send('재품을 생성할 수 없습니다');
        }      

        res.status(201).json({ product });
   
    } catch (error){
        console.log(error);
        res.status(500).json({error:'Server error adding product'});
    }
});

router.get("/images/:key", async (req, res) => {
    const key = req.params.key;
    const imageUrl = getProductImageFile(key);
    res.send(imageUrl)
});

router.delete("/imagedelete/:key", async(req, res) => {
    const key = req.params.key;
    deleteProductUrl(key)
    res.send()
})
// get only the count number of featured products
router.get(`/get/featured/:count`, getFeaturedProductsOfCounts);

module.exports = router;