const mongoose = require('mongoose');
const {Product} = require('./models/product'); 

async function updateProductsOnSaleStatus() {
    try {

        console.log('Running updateProductsOnSaleStatus function at:', new Date());

        // Find products where saleEndDate has passed and onSale is true
        const currentDate = new Date();
        console.log('Current Date:', currentDate);
        const productsToUpdate = await Product.find({
            $or: [
                { saleEndDate: { $lt: currentDate } }, // Products where saleEndDate has passed
                { saleStartDate: { $gt: currentDate } }, // Products where saleStartDate has not yet arrived
            ],
            onSale: true,
        });

        console.log('Products to Update:', productsToUpdate);

        // Iterate through the products to update onSale status
        for (const product of productsToUpdate) {
            console.log('Updating product??:', product._id);
            console.log('Current Date:', currentDate);
            console.log('Sale Start Date:', product.saleStartDate);
            if (currentDate >= product.saleStartDate) {
                product.onSale = true;
                console.log('Product is now on sale.');
            } else {
                product.onSale = false;
                console.log('Product is not on sale.');
            }
            await product.save();
            console.log('Updated product!!:', product._id);
        }

        console.log('Updated products:', productsToUpdate.length);
    } catch (error) {
        console.error('Error updating products:', error);
    }
}

module.exports = { updateProductsOnSaleStatus };
