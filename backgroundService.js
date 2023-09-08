const mongoose = require('mongoose');
const {Product} = require('./models/product'); 

async function updateProductsOnSaleStatus() {
    try {

        console.log('Running updateProductsOnSaleStatus function at:', new Date());

        // Find products where saleEndDate has passed and onSale is true
        const currentDate = new Date();
        const productsToUpdate = await Product.find({
            saleEndDate: { $lte: currentDate },
            onSale: true,
        });

        // Update the onSale status based on saleStartDate
        for (const product of productsToUpdate) {
            if (currentDate >= product.saleEndDate) {
                product.onSale = false;
            } else {
                product.onSale = true;
            }

            await product.save();
        }

        console.log('Updated products:', productsToUpdate.length);
    } catch (error) {
        console.error('Error updating products:', error);
    }
}

module.exports = { updateProductsOnSaleStatus };
