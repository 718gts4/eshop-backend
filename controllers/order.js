const { Order } = require("../models/order");
const { OrderItem } = require("../models/order-item");
const { Product } = require("../models/product");
const moment = require("moment");
const mongoose = require("mongoose");

exports.getOrders = async (req, res) => {
    const orderList = await Order.find()
        .populate("user", "name")
        .sort({ dateOrdered: -1 });

    if (!orderList) {
        res.status(500).json({ success: false });
    }
    res.send(orderList);
};

exports.getOrder = async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate("user", "name")
        .populate({
            path: "orderItems",
            populate: {
                path: "product",
                populate: "category",
            },
        });

    if (!order) {
        res.status(500).json({ success: false });
    }
    res.send(order);
};

exports.getOrderItems = async (req, res) => {
    try {
        const sellerId = req.params.sellerId;

        // Check if the sellerId is a valid ObjectId
        if (!mongoose.isValidObjectId(sellerId)) {
            return res
                .status(400)
                .json({ success: false, error: "Invalid sellerId" });
        }

        const orderItems = await OrderItem.find({ sellerId: sellerId })
            .populate("product")
            .populate("address")
            .populate("buyer", [
                "username",
                "image",
                "_id",
                "name",
                "email",
                "phone",
            ])
            .sort({ dateOrdered: -1 });

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
    const randomNumber = Math.floor(
        1000000000000000 + Math.random() * 9000000000000000
    );
    const parentOrderNumber = randomNumber.toString();

    let order = new Order({
        address: req.body.address,
        status: req.body.status,
        deliveryFee: req.body.deliveryFee,
        productPrice: req.body.productPrice,
        user: req.body.user,
        parentOrderNumber: parentOrderNumber,
    });

    try {
        order = await order.save();
    } catch (error) {
        return res.status(400).send("The order cannot be created");
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
        },
    ];

    const orderItemsIds = Promise.all(
        req.body.orderItems.map(async (orderItem) => {
            console.log('Product ID', orderItem.product._id)
            const product = await Product.findById(orderItem.product._id);
    
            // Check if the product is not sold out and has enough stock for each size
            for (const size of product.colorOptions.sizes) {
                if (size.soldout || size.stock < orderItem.quantity) {
                    return res.status(400).send(`Product '${product.name}' is sold out or not enough stock for size '${size.size}'`);
                }
            }

            // Update the stock for each size
            for (const size of product.colorOptions.sizes) {
                const newStock = size.stock - orderItem.quantity;

                await Product.findByIdAndUpdate(orderItem.product.id, {
                    $set: { 'colorOptions.sizes.$[elem].stock': newStock },
                }, { arrayFilters: [{ 'elem.size': size.size }] });
            }
            
            const randomNumberDigit = Math.floor(
                1000000000000000 + Math.random() * 9000000000000000
            );
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
                paidPrice:
                    orderItem.product.price *
                    orderItem.product.selectedQuantity,
                deliveryFeeAmount: orderItem.product.deliveryFeeAmount,
                selectedColor: orderItem.product.selectedColor || "",
                selectedSize: orderItem.product.selectedSize || "",
                subOption1: orderItem.product.subOption1 || "",
                subOption2: orderItem.product.subOption2 || "",
                subOption3: orderItem.product.subOption3 || "",
            });
            newOrderItem = await newOrderItem.save();

            const orderItemData = {
                orderItemNumber: orderNumber,
                product: orderItem.product.id,
                quantity: orderItem.quantity,
                orderStatus: orderStatus,
            };

            orderItemsData.push(orderItemData);

            return newOrderItem._id;
        })
    );

    const orderItemsIdsResolved = await orderItemsIds;

    const totalPrices = await Promise.all(
        orderItemsIdsResolved.map(async (orderItemId) => {
            const orderItem = await OrderItem.findById(orderItemId).populate(
                "product",
                "price"
            );
            const totalPrice = orderItem.product.price * orderItem.quantity;
            return totalPrice;
        })
    );

    const totalPrice = totalPrices.reduce((a, b) => a + b, 0);

    order.orderItems = orderItemsIdsResolved;
    order.totalPrice = totalPrice;

    try {
        // Save the updated order object with totalPrice to the database
        const updatedOrder = await order.save();
        res.send(updatedOrder);
    } catch (error) {
        return res.status(500).send("An error occurred while saving the order");
    }
};

exports.toggleOrderStatus = async (req, res) => {
    const orderItemId = req.params.orderItemId;
    const statusIndex = req.params.orderStatusIndex;
    try {
        const orderItem = await OrderItem.findById(orderItemId);

        if (!orderItem) {
            return res
                .status(404)
                .json({ success: false, message: "Order not found." });
        }

        const updatedOrderStatus = [...orderItem.orderStatus];

        updatedOrderStatus[statusIndex].isCompleted =
            !updatedOrderStatus[statusIndex].isCompleted;
        orderItem.orderStatus = updatedOrderStatus;

        const updatedOrderItem = await orderItem.save();

        res.json({ success: true, orderItem: updatedOrderItem });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.updateOrder = async (req, res) => {
    const order = await Order.findByIdAndUpdate(
        req.params.id,
        {
            status: req.body.status,
        },
        { new: true }
    );

    if (!order) return res.status(400).send("the order cannot be update!");

    res.send(order);
};

exports.deleteOrder = async (req, res) => {
    Order.findByIdAndRemove(req.params.id)
        .then(async (order) => {
            if (order) {
                await order.orderItems.map(async (orderItem) => {
                    await OrderItem.findByIdAndRemove(orderItem);
                });
                return res
                    .status(200)
                    .json({ success: true, message: "the order is deleted" });
            } else {
                return res
                    .status(404)
                    .json({ success: false, message: "order not found" });
            }
        })
        .catch((err) => {
            return res.status(400).json({ success: false, error: err });
        });
};

exports.getOrdersCount = async (req, res) => {
    const orderCount = await Order.countDocuments();
    if (!orderCount) {
        res.status(500).json({ success: false });
    }
    res.send({
        orderCount: orderCount,
    });
};

exports.getUserOrders = async (req, res) => {
    const userOrderList = await Order.find({ user: req.params.userid })
        .populate("address")
        .populate({
            path: "orderItems",
            populate: {
                path: "product",
                populate: "category",
            },
        })
        .sort({ dateOrdered: -1 });

    if (!userOrderList) {
        res.status(500).json({ success: false });
    }

    res.send(userOrderList);
};

exports.updateDisplayOrder = async (req, res) => {
    const orderId = req.params.orderId;

    try {
        const order = await Order.findByIdAndUpdate(
            orderId,
            { $set: { display: "false" } }, // Update the "display" property to "false"
            { new: true } // Return the updated document
        );

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        return res
            .status(200)
            .json({ message: "Order display updated successfully", order });
    } catch (error) {
        return res.status(500).json({
            message: "An error occurred while updating order display",
            error,
        });
    }
};

exports.getOrderItemCountsBySeller = async (req, res) => {
    try {
        const orderItemCounts = await OrderItem.aggregate([
            {
                $group: {
                    _id: "$sellerId", // Group by sellerId
                    count: { $sum: 1 }, // Count the number of order items for each sellerId
                },
            },
        ]);

        const productCounts = await Product.aggregate([
            {
                $group: {
                    _id: "$sellerId",
                    count: { $sum: 1 },
                },
            },
        ]);

        const orderItemsWithSellerInfo = await OrderItem.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "sellerId",
                    foreignField: "_id",
                    as: "sellerInfo",
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
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.updateOrderItemToCanceled = async (req, res) => {
    try {
        const { orderItemId } = req.params; // Assuming you pass the orderItem ID as a route parameter

        const updatedOrderItem = await OrderItem.findByIdAndUpdate(
            orderItemId,
            { isCanceled: true },
            { new: true } // This option returns the updated document
        );

        if (!updatedOrderItem) {
            return res.status(404).json({
                success: false,
                message: "OrderItem not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "OrderItem updated to canceled successfully",
            orderItem: updatedOrderItem,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to update OrderItem to canceled",
            error: error.message,
        });
    }
};

exports.getTotalSalesForSeller = async (req, res) => {
    try {
        const { sellerId } = req.params;
        const startDate = moment().subtract(24, "hours").toDate();
        const startOfWeekDate = moment().subtract(7, "days").toDate();
        const startOfMonthDate = moment()
            .subtract(1, "months")
            .startOf("month")
            .toDate();
        const startOfPreviousDay = moment()
            .subtract(1, "days")
            .startOf("day")
            .toDate();
        const endOfPreviousDay = moment()
            .subtract(1, "days")
            .endOf("day")
            .toDate();
        const startOfDayBeforeYesterday = moment()
            .subtract(2, "days")
            .startOf("day")
            .toDate();
        const endOfDayBeforeYesterday = moment()
            .subtract(2, "days")
            .endOf("day")
            .toDate();
        const startOf3Day = moment()
            .subtract(3, "days")
            .startOf("day")
            .toDate();
        const endOf3Day = moment().subtract(3, "days").endOf("day").toDate();
        const startOf4Day = moment()
            .subtract(4, "days")
            .startOf("day")
            .toDate();
        const endOf4Day = moment().subtract(4, "days").endOf("day").toDate();
        const startOf5Day = moment()
            .subtract(5, "days")
            .startOf("day")
            .toDate();
        const endOf5Day = moment().subtract(5, "days").endOf("day").toDate();
        const startOf6Day = moment()
            .subtract(6, "days")
            .startOf("day")
            .toDate();
        const endOf6Day = moment().subtract(6, "days").endOf("day").toDate();
        const startOfLast30Days = moment()
            .subtract(30, "days")
            .startOf("day")
            .toDate();
        const endOfToday = moment().endOf("day").toDate();

        const totalSale = await OrderItem.aggregate([
            { $match: { sellerId: mongoose.Types.ObjectId(sellerId) } },
            {
                $group: {
                    _id: null,
                    totalPaidSale: { $sum: "$paidPrice" },
                    totalDeliveryFee: { $sum: "$deliveryFeeAmount" },
                    totalNumberOfSales: { $sum: 1 },
                },
            },
        ]);

        const totalCanceled = await OrderItem.aggregate([
            {
                $match: {
                    sellerId: mongoose.Types.ObjectId(sellerId),
                    isCanceled: true,
                },
            },
            {
                $group: {
                    _id: null,
                    totalPaidSaleCancelled: { $sum: "$paidPrice" },
                    totalDeliveryFeeCancelled: { $sum: "$deliveryFeeAmount" },
                    totalNumberOfSalesCancelled: { $sum: 1 },
                },
            },
        ]);

        const totalCanceledLast30Days = await OrderItem.aggregate([
            {
                $match: {
                    sellerId: mongoose.Types.ObjectId(sellerId),
                    isCanceled: true,
                    dateOrdered: {
                        $gte: startOfLast30Days,
                        $lte: endOfToday,
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    totalPaidSaleCancelled: { $sum: "$paidPrice" },
                    totalDeliveryFeeCancelled: { $sum: "$deliveryFeeAmount" },
                    totalNumberOfSalesCancelled: { $sum: 1 },
                },
            },
        ]);

        const totalDailySale = await OrderItem.aggregate([
            {
                $match: {
                    sellerId: mongoose.Types.ObjectId(sellerId),
                    dateOrdered: { $gte: startDate }, // Filter by the past 24 hours
                },
            },
            {
                $group: {
                    _id: null,
                    totalPaidSale: { $sum: "$paidPrice" },
                    totalDeliveryFee: { $sum: "$deliveryFeeAmount" },
                    totalNumberOfSales: { $sum: 1 },
                },
            },
        ]);

        const totalWeeklySale = await OrderItem.aggregate([
            {
                $match: {
                    sellerId: mongoose.Types.ObjectId(sellerId),
                    dateOrdered: { $gte: startOfWeekDate }, // Filter by the past 7 days
                },
            },
            {
                $group: {
                    _id: null,
                    totalPaidSale: { $sum: "$paidPrice" },
                    totalDeliveryFee: { $sum: "$deliveryFeeAmount" },
                    totalNumberOfSales: { $sum: 1 },
                },
            },
        ]);

        const totalMonthlySale = await OrderItem.aggregate([
            {
                $match: {
                    sellerId: mongoose.Types.ObjectId(sellerId),
                    dateOrdered: { $gte: startOfMonthDate }, // Filter by the past month
                },
            },
            {
                $group: {
                    _id: null,
                    totalPaidSale: { $sum: "$paidPrice" },
                    totalDeliveryFee: { $sum: "$deliveryFeeAmount" },
                    totalNumberOfSales: { $sum: 1 },
                },
            },
        ]);

        const totalPreviousDaySale = await OrderItem.aggregate([
            {
                $match: {
                    sellerId: mongoose.Types.ObjectId(sellerId),
                    dateOrdered: {
                        $gte: startOfPreviousDay,
                        $lte: endOfPreviousDay,
                    }, // Filter by the previous day
                },
            },
            {
                $group: {
                    _id: null,
                    totalPaidSale: { $sum: "$paidPrice" },
                    totalDeliveryFee: { $sum: "$deliveryFeeAmount" },
                    totalNumberOfSales: { $sum: 1 },
                },
            },
        ]);

        const totalDayBeforeYesterdaySale = await OrderItem.aggregate([
            {
                $match: {
                    sellerId: mongoose.Types.ObjectId(sellerId),
                    dateOrdered: {
                        $gte: startOfDayBeforeYesterday,
                        $lte: endOfDayBeforeYesterday,
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    totalPaidSale: { $sum: "$paidPrice" },
                    totalDeliveryFee: { $sum: "$deliveryFeeAmount" },
                    totalNumberOfSales: { $sum: 1 },
                },
            },
        ]);

        const totalPrevious3DaySale = await OrderItem.aggregate([
            {
                $match: {
                    sellerId: mongoose.Types.ObjectId(sellerId),
                    dateOrdered: {
                        $gte: startOf3Day,
                        $lte: endOf3Day,
                    }, // Filter by the previous day
                },
            },
            {
                $group: {
                    _id: null,
                    totalPaidSale: { $sum: "$paidPrice" },
                    totalDeliveryFee: { $sum: "$deliveryFeeAmount" },
                    totalNumberOfSales: { $sum: 1 },
                },
            },
        ]);

        const totalPrevious4DaySale = await OrderItem.aggregate([
            {
                $match: {
                    sellerId: mongoose.Types.ObjectId(sellerId),
                    dateOrdered: {
                        $gte: startOf4Day,
                        $lte: endOf4Day,
                    }, // Filter by the previous day
                },
            },
            {
                $group: {
                    _id: null,
                    totalPaidSale: { $sum: "$paidPrice" },
                    totalDeliveryFee: { $sum: "$deliveryFeeAmount" },
                    totalNumberOfSales: { $sum: 1 },
                },
            },
        ]);

        const totalPrevious5DaySale = await OrderItem.aggregate([
            {
                $match: {
                    sellerId: mongoose.Types.ObjectId(sellerId),
                    dateOrdered: {
                        $gte: startOf5Day,
                        $lte: endOf5Day,
                    }, // Filter by the previous day
                },
            },
            {
                $group: {
                    _id: null,
                    totalPaidSale: { $sum: "$paidPrice" },
                    totalDeliveryFee: { $sum: "$deliveryFeeAmount" },
                    totalNumberOfSales: { $sum: 1 },
                },
            },
        ]);

        const totalPrevious6DaySale = await OrderItem.aggregate([
            {
                $match: {
                    sellerId: mongoose.Types.ObjectId(sellerId),
                    dateOrdered: {
                        $gte: startOf6Day,
                        $lte: endOf6Day,
                    }, // Filter by the previous day
                },
            },
            {
                $group: {
                    _id: null,
                    totalPaidSale: { $sum: "$paidPrice" },
                    totalDeliveryFee: { $sum: "$deliveryFeeAmount" },
                    totalNumberOfSales: { $sum: 1 },
                },
            },
        ]);

        const latestBuyers = await OrderItem.find({ sellerId })
            .sort({ dateOrdered: -1 })
            .limit(3)
            .populate("buyer", ["name", "email", "image", "username"])
            .populate("product");

        // Check if totalSales is empty
        if (totalSale.length === 0) {
            return res
                .status(404)
                .send("No sales data found for the specified seller");
        }

        // Respond with the total sales
        res.send({
            totalSale: totalSale,
            totalCanceled: totalCanceled,
            totalDailySale: totalDailySale,
            totalWeeklySale: totalWeeklySale,
            totalMonthlySale: totalMonthlySale,
            totalPreviousDaySale: totalPreviousDaySale,
            totalPrevious3DaySale: totalPrevious3DaySale,
            totalPrevious4DaySale: totalPrevious4DaySale,
            totalPrevious5DaySale: totalPrevious5DaySale,
            totalPrevious6DaySale: totalPrevious6DaySale,
            totalDayBeforeYesterdaySale: totalDayBeforeYesterdaySale,
            latestBuyers: latestBuyers,
            totalCanceledLast30Days: totalCanceledLast30Days,
        });
    } catch (error) {
        console.error("Error calculating total sales:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.flexibleUpdate = async (req, res) => {
    try {
        const updates = req.body;

        const result = await Promise.all(
            updates.map(async ({ orderId, currentStatus, newStatus }) => {
                const updateResult = await Order.updateOne(
                    { _id: orderId, status: currentStatus },
                    { $set: { status: newStatus } }
                );

                return { orderId, success: updateResult.modifiedCount > 0 };
            })
        );
        res.status(200).json({ success: true, updates: result });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
