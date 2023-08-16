const {Order} = require('../models/order');
const {OrderItem} = require('../models/order-item');

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

exports.postOrder = async (req, res) => {
    
    const orderItemsIds = Promise.all(req.body.orderItems.map(async (orderItem) =>{
        let newOrderItem = new OrderItem({
            quantity: orderItem.quantity,
            product: orderItem.product.id,
            buyer: req.body.user,
            address: req.body.address,
            sellerId: orderItem.sellerId,
        })
        newOrderItem = await newOrderItem.save();

        return newOrderItem._id;
    }))
    const orderItemsIdsResolved =  await orderItemsIds;

    const totalPrices = await Promise.all(orderItemsIdsResolved.map(async (orderItemId)=>{
        const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price');
        const totalPrice = orderItem.product.price * orderItem.quantity;
        return totalPrice
    }))

    const totalPrice = totalPrices.reduce((a,b) => a +b , 0);

    // Generate a random 16-digit number for orderNumber
    const randomNumber = Math.floor(1000000000000000 + Math.random() * 9000000000000000);
    const orderNumber = randomNumber.toString();

    let order = new Order({
        orderItems: orderItemsIdsResolved,
        address: req.body.address,
        status: req.body.status,
        deliveryFee: req.body.deliveryFee,
        productPrice: req.body.productPrice,
        totalPrice: totalPrice,
        user: req.body.user,
        orderStatus: req.body.orderStatus = [
            {
                type: "주문완료",
                date: new Date(),
                isCompleted: true,
            },
            {
                type: "주문확인",
                isCompleted: false,
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
        ],
        orderNumber: orderNumber,
    })
    order = await order.save();

    if(!order)
    return res.status(400).send('the order cannot be created!')

    res.send(order);
}

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

