const { getOrders, getOrder, postOrder, updateOrder, deleteOrder,getTotalSales, getOrdersCount, getUserOrders } = require('../controllers/order');
const express = require('express');
const router = express.Router();

router.get(`/`, getOrders);
router.get(`/:id`, getOrder);
router.post('/', postOrder);
router.put('/:id', updateOrder);
router.delete(`/:id`, deleteOrder);
router.get('/get/totalsales', getTotalSales);
router.get(`/get/count`, getOrdersCount);
router.get(`/get/userorders/:userid`, getUserOrders);

module.exports = router;