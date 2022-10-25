const {Product} = require('../models/product');
const {Category} = require('../models/category');
const mongoose = require('mongoose');
const slugify = require('slugify');


exports.createProduct = async (req, res) => {

    const category = await Category.findById(req.body.category);
    if(!category) return res.status(400).send('Invalid Category');

    // const file = req.file;
    // if (!file) return res.status(400).send('No image in the request');

    const files = req.files;
    if (!files) return res.status(400).send('No images in the request');

    let productImages = [];
    if (req.files.length > 0){
        productImages = req.files.map(file => {
            let fileName = file.filename;
            let basePath = `${req.protocol}://${req.get('host')}/uploads/`;
            let imageUrl = `${basePath}${fileName}`; // "http://localhost:3000/public/upload/image-2323232"
            return { img: imageUrl }
        });
    }

    let product = new Product({
        name: req.body.name,
        slug: slugify(req.body.name),
        description: req.body.description,
        richDescription: req.body.richDescription,
        productImages: productImages,
        image: req.body.image,
        brand: req.body.brand,
        price: req.body.price,
        category: category,
        countInStock: req.body.countInStock,
        isFeatured: req.body.isFeatured
        // createdBy: req.user._id
    });

    product = await product.save();

    if(!product)
    return res.status(500).send('재품을 생성할 수 없습니다')

    res.status(201).json({product});
}

exports.getProducts = async (req, res) => {
    // localhost:3000/api/v1/products?categories=123412,321124
    let filter = {};

    if(req.query.categories)
    {
        filter = {category: req.query.categories.split(',')}
    }

    const productList = await Product.find(filter).populate('category');

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

exports.updateProduct = async (req, res) => {
    if(!mongoose.isValidObjectId(req.params.id)){
        res.status(400).send('Invalid Product ID');
    }
    const category = await Category.findById(req.body.category);
    if(!category) return res.status(400).send('Invalid Category');

    const product = await Product.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            slug: slugify(req.body.name),
            description: req.body.description,
            richDescription: req.body.richDescription,
            productImages: req.body.productImages,
            image: req.body.image,
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category,
            countInStock: req.body.countInStock,
            rating: req.body.rating,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured
        },
        { new: true}
    );

    if(!product)
    return res.status(500).send('the product cannot be updated!')
    
    res.send(product);
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

