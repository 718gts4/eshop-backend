const { getOrders, getOrder, postOrder, updateOrder, deleteOrder,getTotalSales, getOrdersCount, getUserOrders, getOrderItems, toggleOrderStatus, updateDisplayOrder } = require('../controllers/order');
const express = require('express');
const router = express.Router();
const { requireSignin } = require('../common-middleware');

router.get(`/`, getOrders);
router.get(`/:id`, getOrder);
router.get(`/get/adminorders/:sellerId`, getOrderItems, requireSignin);
router.post('/', postOrder);
router.put('/:id', updateOrder);
router.delete(`/:id`, deleteOrder);
router.get('/get/totalsales', getTotalSales);
router.get(`/get/count`, getOrdersCount);
router.get(`/get/userorders/:userid`, getUserOrders, requireSignin);
router.put('/toggle-order-status/:orderItemId/:orderStatusIndex', toggleOrderStatus, requireSignin);
router.put(`/:id/updateDisplay`, updateDisplayOrder);

module.exports = router;