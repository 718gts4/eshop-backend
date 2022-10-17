const Order = require('../models/order');
const express = require('express');
const router = express.Router();

router.get(`/`, async (res, req)=>{
    const orderList = await Order.find();

    if(!orderList){
        res.status(500).json({success: false});
    }
    res.send(orderList);
})

module.exports = router;