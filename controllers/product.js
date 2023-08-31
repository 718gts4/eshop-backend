const {Product} = require('../models/product');
const {Category} = require('../models/category');
// const { Sale } = require('../models/sale');
const mongoose = require('mongoose');

exports.createSaleProduct = async (req, res) => {
    try {
        const { productId, discount, saleStartDate, saleEndDate } = req.body;

        // Find the product by its ID
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Update the product's sale-related fields
        product.onSale = true;
        product.discount = discount;
        product.saleStartDate = saleStartDate;
        product.saleEndDate = saleEndDate;

        // Save the updated product
        await product.save();

        res.json({ success: true, message: 'Sale created for product', product });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.getSaleProducts = async (req, res) => {
    try {
        // Find products where onSale is true
        const saleProducts = await Product.find({ "onSale": true });

        res.json({ success: true, saleProducts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


exports.getProducts = async (req, res) => {
    let filter = {};

    if(req.query.categories)
    {
        filter = {category: req.query.categories.split(',')}
    }

    const productList = await Product.find(filter).populate('category').sort({'dateCreated': -1});

    if(!productList){
        res.status(500).json({success:false})
    }
    res.send(productList);
}

exports.getProduct = async (req, res) => {
    const product = await Product.findById(req.params.id).populate('category');

    if(!product){
        res.status(500).json({success:false})
    }
    res.send(product);
}

exports.getProductsByCategoryId = async (req, res) => {
    console.log('req.params.', req.params.categoryId)
    try {
        const categoryId = mongoose.Types.ObjectId(req.params.categoryId);
        const products = await Product.find({ parentCategory: categoryId});

        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({error: 'Failed to retrieve category products'});
    }
}

exports.getProductsByChildCategoryId = async (req, res) => {
    console.log('req.params.', req.params.categoryId)
    try {
        const categoryId = mongoose.Types.ObjectId(req.params.categoryId);
        const products = await Product.find({ category: categoryId});

        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({error: 'Failed to retrieve category products'});
    }
}


exports.getProductsByDropProducts = async (req, res) => {
    try {
        const products = await Product.find({ dropProduct: true});
        res.send(products);
    } catch (error) {
        res.status(500).json({success: false, error: 'Server error'});
    }
}

exports.updateProduct = async (req, res) => {
    if(!mongoose.isValidObjectId(req.params.id)){
        res.status(400).send('Invalid Product ID');
    }
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(400).send('Invalid Product!');

    const category = await Category.findById(product.category);
    if(!category) return res.status(400).send('Invalid Category');

    const file = req.file;
    let imagepath;

    if (file){
        const fileName = file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/uploads/`;
        imagepath = `${basePath}${fileName}`; // "http://localhost:3000/public/upload/image-2323232"
    } else {
        imagepath = product.image;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            description: req.body.description,
            richDescription: req.body.richDescription,
            productImages: req.body.productImages,
            image: imagepath,
            brand: req.body.brand,
            price: req.body.price,
            parentCategory: req.body.parentCategory,
            category: req.body.category,
            rating: req.body.rating,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured,
            colorOptions: req.body.colorOptions,
            subOption1: req.body.subOption1,
            subOption2: req.body.subOption2,
            subOption3: req.body.subOption3,
            display: req.body.display,
            soldout: req.body.soldout,
            isSelling: req.body.isSelling,
        },
        { new: true}
    );

    if(!updatedProduct)
    return res.status(500).send('the product cannot be updated!')
    
    res.send(updatedProduct);
}


exports.updateGalleryImages = async (req, res) => {
    // check if the product id is correct
    if(!mongoose.isValidObjectId(req.params.id)){
        res.status(400).send('Invalid Product ID');
    }
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(400).send('Invalid Product!');

    const files = req.files;
    let productImages = [];

    if (files){
        productImages = files.map(file => {
            let fileName = file.filename;
            let basePath = `${req.protocol}://${req.get('host')}/uploads/`;
            let imageUrl = `${basePath}${fileName}`; // "http://localhost:3000/public/upload/image-2323232"
            return { img: {"name": fileName, "imageUrl": imageUrl} }
        });
    } else {
        productImages = product.productImages;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id, { productImages: productImages }
    );

    if(!updatedProduct)
    return res.status(500).send('the product cannot be updated!')
    
    res.send(updatedProduct);    
}

exports.deleteProduct = async (req, res) => {
    Product.findByIdAndRemove(req.params.id).then(product =>{
        if(product){
            return res.status(200).json({success:true, message:'the product is deleted'})
        } else {
            return res.status(404).json({success:false, message: "product not found"})
        }
    }).catch(err=>{
        return res.status(400).json({success: false, error: err})
    })
}

exports.getProductCount = async (req, res) => {
    const productCount = await Product.countDocuments();

    if (!productCount) {
        res.status(500).json({ success: false });
    }
    res.send({
        productCount: productCount,
    });
}

exports.getFeaturedProductsOfCounts = async (req, res) => {
    // get count number of featured products
    const count = req.params.count ? req.params.count : 0;
    // +count returns number from a string
    const products = await Product.find({isFeatured: true}).limit(+count);

    if(!products) {
        res.status(500).json({success: false})
    } 
    res.send(products);
}


exports.getAdminProducts = async (req, res) => {
    const product = await Product.find({createdBy: req.params.id}).populate('category').sort({'dateCreated': -1});
    if(!product){
        res.status(500).json({success:false})
        .populate('category')
    }
    res.send(product);
}


exports.likeProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        const product = await Product.findById(id);
        const isLiked = product.likes.get(userId);

        if(isLiked){
            product.likes.delete(userId);
        } else {
            product.likes.set(userId, true);
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            { likes: product.likes },
            { new: true }
        );

        res.status(200).json(updatedProduct);
    } catch (err) {
        res.status(404).json({message:err.message})
    }
}

exports.bookmarkProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        const product = await Product.findById(id);
        const isBookmarked = product.bookmarks.get(userId);

        if(isBookmarked){
            product.bookmarks.delete(userId);
        } else {
            product.bookmarks.set(userId, true);
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            { bookmarks: product.bookmarks },
            { new: true }
        );

        res.status(200).json(updatedProduct);
    } catch (err) {
        res.status(404).json({message:err.message})
    }
}

// the below code is a test implementation
exports.getProductsBySlug = (req, res) => {
    const { slug } = req.params;
    Category.findOne({ slug: slug })
      .select("_id type")
      .exec((error, category) => {
        if (error) {
          return res.status(400).json({ error });
        }
  
        if (category) {
          Product.find({ category: category._id }).exec((error, products) => {
            if (error) {
              return res.status(400).json({ error });
            }
  
            if (category.type) {
              if (products.length > 0) {
                res.status(200).json({
                  products,
                  priceRange: {
                    under10k: 10000,
                    under30k: 30000,
                    under50k: 50000,
                    under100k: 100000,
                    under200k: 200000,
                    under300k: 300000,
                  },
                  productsByPrice: {
                    under10k: products.filter(
                      (product) => product.price > 0 && product.price <= 10000
                    ),
                    under30k: products.filter(
                      (product) => product.price > 10000 && product.price <= 30000
                    ),
                    under50k: products.filter(
                      (product) => product.price > 30000 && product.price <= 50000
                    ),
                    under100k: products.filter(
                      (product) => product.price > 50000 && product.price <= 100000
                    ),
                    under200k: products.filter(
                      (product) => product.price > 100000 && product.price <= 200000
                    ),
                    under300k: products.filter(
                      (product) => product.price > 20000 && product.price <= 300000
                    ),
                  },
                });
              }
            } else {
              res.status(200).json({ products });
            }
          });
        }
    });
};

exports.getSearchProducts = async (req, res) => {
    try {
        const { search } = req.query;
        const products = await Product.find({ name: {$regex: search, $options: 'i'}});

        res.json(products);
    } catch (error) {
        console.error('Error', error);
        res.status(500).json({message: 'Server Error'});
    }
}

// exports.getCategoryProducts = async (req, res) => {
//     try {
//         const { categoryId } = req.query;
//         const products = await Product.find({ category: categoryId });
    
//         res.json(products);
//     } catch (error) {
//         console.error('Error', error);
//         res.status(500).json({ message: 'Server Error' });
//     }   
// }

exports.editSaleDuration = async (req, res) => {
    const productId = req.params.id;
    const newEndTime = new Date(req.body.endTime);
  
    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        if (!product.sale) {
            return res.status(400).json({ message: 'Product is not on sale' });
        }
        const currentTime = new Date();
        if (newEndTime <= currentTime) {
            return res.status(400).json({ message: 'Sale end time must be in the future' });
        }
        product.sale.endTime = newEndTime;
        const updatedProduct = await product.save();
        res.json(updatedProduct);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getRecentProducts = async (req, res) => {
    try {
        const oneWeekAgo = new Date();

        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const recentProducts = await Product.find({
            dateCreated: { $lt: new Date(), $gte: oneWeekAgo },
        }).sort({ dateCreated : -1 });

        res.json(recentProducts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch recent products'});
    }
};

exports.createProductReview = async (req, res) => {
    const { rating, comment } = req.body;

    const product = await Product.findById(req.params.id)

    if (product) {
        const alreadyReviewed = product.reviews.find((r) => 
            r.user.toString() === req.user._id.toString())

        if (alreadyReviewed) {
            res.status(400)
            throw new Error('리뷰를 이미 작성했습니다.')
        }

        const review = {
            name: req.user.name,
            rating: Number(rating),
            comment,
            user: req.user._id,
        }

        product.reviews.push(review)

        product.numReviews = product.reviews.length;

        product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

        await product.save()
        res.status(201).json({ message: '리뷰가 작성되었습니다.'})
    } else {
        res.status(404)
        throw new Error('Product not found')
    }
}