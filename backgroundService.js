const mongoose = require('mongoose');
const Product = require('./models/product'); 

async function updateProductsOnSaleStatus() {
    try {

        console.log('Running updateProductsOnSaleStatus function at:', new Date());
        
        // Find products where saleEndDate has passed and onSale is true
        const currentDate = new Date();
        const productsToUpdate = await Product.find({
            saleEndDate: { $lte: currentDate },
            onSale: true,
        });

        // Update the onSale status to false for each product
        for (const product of productsToUpdate) {
            product.onSale = false;
            await product.save();
        }

        console.log('Updated products:', productsToUpdate.length);
    } catch (error) {
        console.error('Error updating products:', error);
    }
}

module.exports = { updateProductsOnSaleStatus };
