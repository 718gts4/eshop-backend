const mongoose = require('mongoose');
const {Product} = require('./models/product'); 

async function updateProductsOnSaleStatus() {
    // heroku sets NODE_ENV to production by default for hosted apps. 
    // When running locally, NODE_ENV is undefined
    if (process.env.NODE_ENV !== 'production') {
        console.log('Skipping updateProductsOnSaleStatus function in non-production environment');
        return;
    }
    try {

        console.log('Running updateProductsOnSaleStatus function at:', new Date());

        // Find products where saleEndDate has passed and onSale is true
        const currentDate = new Date();

        const productsToUpdate = await Product.find({
            saleStartDate: { $lte: currentDate },
            onSale: false,
        });

        for (const product of productsToUpdate) {
            if(currentDate >= product.saleStartDate) {
                product.onSale = true;
            } else {
                product.onSale = false;
            }

            await product.save()
        }

        const productsToUpdate2 = await Product.find({
            saleEndDate: { $lte: currentDate },
            onSale: true,
        });

        // Update the onSale status based on saleStartDate
        for (const product of productsToUpdate2) {
            if (currentDate >= product.saleEndDate) {
                product.onSale = false;
            } else {
                product.onSale = true;
            }

            await product.save();
        }

        console.log('Updating START products:', productsToUpdate.length);
        console.log('Updating END products:', productsToUpdate2.length);
    } catch (error) {
        console.error('Error updating products:', error);
    }
}

module.exports = { updateProductsOnSaleStatus };
