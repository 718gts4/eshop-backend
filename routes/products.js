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
  editSaleDuration
} = require('../controllers/product');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const shortid = require('shortid');
const path = require('path');
const { requireSignin, adminMiddleware } = require('../common-middleware');
const { uploadProductImageToS3 } = require('../s3');
const {Product} = require('../models/product');
const {Category} = require('../models/category');
const slugify = require('slugify');
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
router.put(`/:id`, upload.single('image'), requireSignin, adminMiddleware, updateProduct);
router.put(`/gallery-images/:id`, upload.array('productImages', 10), updateGalleryImages, requireSignin, adminMiddleware);
router.delete(`/:id`, requireSignin, adminMiddleware, deleteProduct);
router.get(`/get/count`, getProductCount);
router.get(`/admin/:id`, getAdminProducts);
router.patch('/:id/like', likeProduct, requireSignin);
router.put('/:id/sale', editSaleDuration, requireSignin);
router.post(`/create`, upload.array("image", 5), requireSignin, adminMiddleware, async (req, res) => {
    console.log('REQ FILES', req.files)

    const {
        name, price, description, richDescription, brand, category, countInStock, isFeatured
    } = req.body;
    const nameSlug = slugify(req.body.name);
    const checkProduct = await Product.find({ slug: { $eq: nameSlug } });
    if (checkProduct.length > 0)
      return res.status(400).send('The name of the product already exists. Please use a different name.');

    try {
        const images = req.files.map((file) => ({
            file: fs.readFileSync(file.path),
        }));

        console.log('images check', images)
        const imageUploadPromises = images.map((image) => uploadProductImageToS3(image));

        const uploadedImages = await Promise.all(imageUploadPromises);
        console.log('uploadeIMGS', uploadedImages);
        const imageUrls = uploadedImages.map((result) => result.key);
        console.log('imageURLS', imageUrls)
        // const productData = req.body;
        // productData.images = imageUrls;

        // res.status(201).json({ success: true, productData});

        if (checkProduct.length === 0) {
            let product = new Product({
                name,
                slug: nameSlug,
                description,
                richDescription,
                productImages: imageUrls,
                // image: imageUrl,
                brand,
                price,
                category,
                countInStock,
                isFeatured,
                createdBy: req.user.userId, // user data from middleware
                likes: {},
                options: req.body.options || null,
                sale: req.body.sale || null,
                subOption1: req.body.subOption1 || null,
                subOption2: req.body.subOption2 || null,
                subOption3: req.body.subOption3 || null,
            });
            console.log('Product sale', product.sale);

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
        }
    } catch (error){
        console.log(error);
        res.status(500).json({error:'Server error adding product'});
    }
});

// get only the count number of featured products
router.get(`/get/featured/:count`, getFeaturedProductsOfCounts);

module.exports = router;