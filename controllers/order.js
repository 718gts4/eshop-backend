const {Order} = require('../models/order');
const {OrderItem} = require('../models/order-item');
const {Product} = require('../models/product');
const mongoose = require('mongoose');

exports.getOrders = async (req, res) => {
    const orderList = await Order.find().populate('user', 'name').sort({'dateOrdered': -1});

    if(!orderList){
        res.status(500).json({success: false});
    }
    res.send(orderList);
}

exports.getOrder = async (req, res) => {
    const order = await Order.findById(req.params.id)
    .populate('user', 'name')
    .populate({ 
        path: 'orderItems', populate: { 
            path: 'product', populate: 'category'}
        });

    if(!order){
        res.status(500).json({success: false});
    }
    res.send(order);
}

exports.getOrderItems = async (req, res) => {
    try {
        const sellerId = req.params.sellerId;

        // Check if the sellerId is a valid ObjectId
        if (!mongoose.isValidObjectId(sellerId)) {
            return res.status(400).json({ success: false, error: 'Invalid sellerId' });
        }

        const orderItems = await OrderItem.find({ sellerId: sellerId })
            .populate('product')
            .populate('address')
            .populate('buyer', ['username', 'image', '_id', 'name', 'email', 'phone'])
            .sort({'dateOrdered': -1});

        if (!orderItems) {
            return res.status(500).json({ success: false });
        }

        // Send the retrieved orderItems
        res.status(200).json(orderItems);
    } catch (error) {
        // Handle errors gracefully
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.postOrder = async (req, res) => {   
    // Generate a random 16-digit number for orderNumber
    const randomNumber = Math.floor(1000000000000000 + Math.random() * 9000000000000000);
    const parentOrderNumber = randomNumber.toString();

    let order = new Order({
        address: req.body.address,
        status: req.body.status,
        deliveryFee: req.body.deliveryFee,
        productPrice: req.body.productPrice,
        user: req.body.user,
        parentOrderNumber: parentOrderNumber,
    })

    try {
        order = await order.save();
    } catch (error) {
        return res.status(400).send('The order cannot be created');
    }

    const orderId = order._id;

    const orderItemsData = [];
    const orderStatus = [
        {
            type: "결제완료",
            date: new Date(),
            isCompleted: true,
        },
        {
            type: "준비중",
            isCompleted: false,
        },
        {
            type: "배송중",
            isCompleted: false,
        },
        {
            type: "배송완료",
            isCompleted: false,
        }
    ];

    const orderItemsIds = Promise.all(req.body.orderItems.map(async (orderItem) =>{
        const randomNumberDigit = Math.floor(1000000000000000 + Math.random() * 9000000000000000);
        const orderNumber = randomNumberDigit.toString();

        let newOrderItem = new OrderItem({
            quantity: orderItem.product.selectedQuantity || 1,
            product: orderItem.product.id,
            buyer: req.body.user,
            address: req.body.address,
            sellerId: orderItem.product.createdBy,
            orderNumber: orderNumber,
            parentOrderNumber: parentOrderNumber,
            orderStatus: orderStatus,
            parentOrderId: orderId,
            paidPrice: orderItem.product.price * orderItem.product.selectedQuantity,
            deliveryFeeAmount: orderItem.product.deliveryFeeAmount,
            selectedColor: orderItem.product.selectedColor || '',
            selectedSize: orderItem.product.selectedSize || '',
            subOption1: orderItem.product.subOption1 || '',
            subOption2: orderItem.product.subOption2 || '',
            subOption3: orderItem.product.subOption3 || '',
        })
        newOrderItem = await newOrderItem.save();

        const orderItemData = {
            orderItemNumber: orderNumber,
            product: orderItem.product.id,
            quantity: orderItem.quantity,
            orderStatus: orderStatus,
        };

        orderItemsData.push(orderItemData);

        return newOrderItem._id;
    }))

    const orderItemsIdsResolved =  await orderItemsIds;

    const totalPrices = await Promise.all(orderItemsIdsResolved.map(async (orderItemId)=>{
        const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price');
        const totalPrice = orderItem.product.price * orderItem.quantity;
        return totalPrice
    }))

    const totalPrice = totalPrices.reduce((a,b) => a +b , 0);

    order.orderItems = orderItemsIdsResolved;
    order.totalPrice = totalPrice;

    try {
        // Save the updated order object with totalPrice to the database
        const updatedOrder = await order.save();
        res.send(updatedOrder);
    } catch (error) {
        return res.status(500).send('An error occurred while saving the order');
    }
}

exports.toggleOrderStatus = async (req, res) => {
    const orderItemId = req.params.orderItemId;
    const statusIndex = req.params.orderStatusIndex;
    try {
        const orderItem = await OrderItem.findById(orderItemId);


        if(!orderItem) {
            return res.status(404).json({success: false, message: 'Order not found.'});
        }

        const updatedOrderStatus = [...orderItem.orderStatus];

        updatedOrderStatus[statusIndex].isCompleted = !updatedOrderStatus[statusIndex].isCompleted;
        orderItem.orderStatus = updatedOrderStatus;

        const updatedOrderItem = await orderItem.save();

        res.json({success: true, orderItem: updatedOrderItem});
    } catch (error) {
        res.status(500).json({success: false, message: 'Server error'});
    }
};

exports.updateOrder = async (req, res) => {
    const order = await Order.findByIdAndUpdate(
        req.params.id,
        {
            status: req.body.status
        },
        { new: true}
    )

    if(!order)
    return res.status(400).send('the order cannot be update!')

    res.send(order);
}

exports.deleteOrder = async (req, res) => {
    Order.findByIdAndRemove(req.params.id).then(async order =>{
        if(order) {
            await order.orderItems.map(async orderItem => {
                await OrderItem.findByIdAndRemove(orderItem)
            })
            return res.status(200).json({success:true, message:'the order is deleted'})
        } else {
            return res.status(404).json({success:false, message: "order not found"})
        }
    }).catch(err=>{
        return res.status(400).json({success: false, error: err})
    })
}

exports.getOrdersCount = async (req, res) => {
    const orderCount = await Order.countDocuments();
    if (!orderCount) {
        res.status(500).json({ success: false });
    }
    res.send({
        orderCount: orderCount,
    });
}

exports.getTotalSales = async (req, res) => {
    // below is data received from mongodb with mongoose method $sum
    const totalSales = await Order.aggregate([
        { $group : { _id: null, totalsales : { $sum: '$totalPrice'} }}
    ])

    if(!totalSales) {
        return res.status(400).send('The order sales cannot be generated')
    }

    // use .pop() to only collect certain data from array
    res.send({totalsales: totalSales.pop().totalsales})
}

exports.getUserOrders = async (req, res) => {
    const userOrderList = await Order.find({user: req.params.userid})
    .populate('address')
    .populate({
        path: 'orderItems', populate: {
            path: 'product', populate: 'category'
        }
    })
    .sort({'dateOrdered': -1});

    if(!userOrderList){
        res.status(500).json({success: false});
    }

    res.send(userOrderList);
}

exports.updateDisplayOrder = async (req, res) => {
    const orderId = req.params.orderId; 

    try {
        const order = await Order.findByIdAndUpdate(
            orderId,
            { $set: { display: "false" } }, // Update the "display" property to "false"
            { new: true } // Return the updated document
        );
    
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
    
        return res.status(200).json({ message: 'Order display updated successfully', order });
    } catch (error) {
        return res.status(500).json({ message: 'An error occurred while updating order display', error });
    }
 };

exports.getOrderItemCountsBySeller = async (req, res) => {
    try {
        const orderItemCounts = await OrderItem.aggregate([
            {
                $group: {
                    _id: '$sellerId', // Group by sellerId
                    count: { $sum: 1 }, // Count the number of order items for each sellerId
                },
            },
        ]);

        const productCount = await Product.aggregate([
            {
                $group: {
                    _id: '$sellerId',
                    count: { $sum: 1},
                },
            },
        ]);

        const orderItemsWithSellerInfo = await OrderItem.aggregate([
            {
                $lookup: {
                    from: 'users', 
                    localField: 'sellerId', 
                    foreignField: '_id', 
                    as: 'sellerInfo', 
                },
            },
        ]);

        const combinedResults = orderItemCounts.map((orderItemCount) => {
            const sellerId = orderItemCount._id;
            const sellerInfo = orderItemsWithSellerInfo.find(
                (item) => item.sellerId.toString() === sellerId.toString()
            );
            const productCount = productCounts.find(
                (item) => item._id.toString() === sellerId.toString()
            );
            return {
                _id: sellerId,
                count: orderItemCount.count,
                productCount: productCount ? productCount.count : 0,
                sellerInfo: sellerInfo ? sellerInfo.sellerInfo[0] : null,
            };
        });

        combinedResults.sort((a, b) => b.count - a.count);
        
        res.json(combinedResults);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};