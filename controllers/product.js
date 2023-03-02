const {Product} = require('../models/product');
const {Category} = require('../models/category');
const mongoose = require('mongoose');
const slugify = require('slugify');


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

exports.createProduct = async (req, res) => {

    const category = await Category.findById(req.body.category);
    if(!category) return res.status(400).send('Invalid Category');

    const nameSlug = slugify(req.body.name);
    const checkProduct = await Product.find({slug: { $eq: nameSlug}});
    if(checkProduct.length > 0) 
    return res.status(400).send('The name of the product already exists. Please use a different name.');

    if (checkProduct.length ===0){
        const file = req.file;
        if (!file) return res.status(400).send('이미지 파일을 추가하시기 바랍니다');
    
        const fileName = file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/uploads/`;
        const imageUrl = `${basePath}${fileName}`; // "http://localhost:3000/public/upload/image-2323232"

        let product = new Product({
            name: req.body.name,
            slug: nameSlug,
            description: req.body.description,
            richDescription: req.body.richDescription,
            productImages: req.body.productImages,
            image: imageUrl,
            brand: req.body.brand,
            price: req.body.price,
            category: category,
            countInStock: req.body.countInStock,
            isFeatured: req.body.isFeatured,
            createdBy: req.user.userId, //user data from middleware
            likes: {},
            options: req.body.options || null,
            sale: req.body.sale || null
        });

        if (product.sale) {
            const endTime = new Date(req.body.sale.endTime);
            const currentTime = new Date();
            if (endTime <= currentTime){
                return res.status(400).json({message: "Sale이 마감되었습니다"});
            }
            product.sale.endTime = endTime;
        }
    
        product = await product.save();
    
        if(!product)
        return res.status(500).send('재품을 생성할 수 없습니다')
    
        res.status(201).json({product});
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
            slug: slugify(req.body.name),
            description: req.body.description,
            richDescription: req.body.richDescription,
            productImages: req.body.productImages,
            image: imagepath,
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category,
            countInStock: req.body.countInStock,
            rating: req.body.rating,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured,
            options: req.body.options
        },
        { new: true}
    );

    if(!updatedProduct)
    return res.status(500).send('the product cannot be updated!')
    
    res.send(updatedProduct);
}


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
    const product = await Product.find({createdBy: req.params.id});
    if(!product){
        res.status(500).json({success:false}).populate('category')
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

