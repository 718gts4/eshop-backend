const mongoose = require('mongoose');
const {Product} = require('./models/product'); 

async function updateProductsOnSaleStatus() {
    try {

        console.log('Running updateProductsOnSaleStatus function at:', new Date());

        // Find products where saleEndDate has passed and onSale is true
        const currentDate = new Date();
        const productsToUpdate = await Product.find({
            $or: [
                { saleEndDate: { $lte: currentDate } }, // Products where saleEndDate has passed
                { saleStartDate: { $gt: currentDate } }, // Products where saleStartDate has not yet arrived
            ],
            onSale: true,
        });

        // Iterate through the products to update onSale status
        for (const product of productsToUpdate) {
            if (currentDate >= product.saleStartDate) {
                product.onSale = true;
            } else {
                product.onSale = false;
            }
            await product.save();
        }

        console.log('Updated products:', productsToUpdate.length);
    } catch (error) {
        console.error('Error updating products:', error);
    }
}

module.exports = { updateProductsOnSaleStatus };
