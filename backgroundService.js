const mongoose = require('mongoose');
const {Product} = require('./models/product'); 
const moment = require('moment-timezone');

async function updateProductsOnSaleStatus() {
    try {

        console.log('Running updateProductsOnSaleStatus function at:', new Date());

        moment.tz.setDefault('Asia/Seoul');

        // Find products where saleEndDate has passed and onSale is true
        const currentDate = moment();
        console.log('Current Date In Seoul: ', currentDate.format());

        const productsToUpdate = await Product.find({
            $or: [
                { saleEndDate: { $lt: currentDate.toDate() } }, // Products where saleEndDate has passed
                { saleStartDate: { $gt: currentDate.toDate() } }, // Products where saleStartDate has not yet arrived
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
