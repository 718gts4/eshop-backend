const express = require('express');
const router = express.Router();
const { requireSignin, adminMiddleware } = require('../common-middleware');
const {createCanceledOrder, getCanceledOrdersByUser, deleteCanceledOrder} = require('../controllers/canceledOrder');

router.post('/canceledorders', createCanceledOrder);
router.get('/user/:userId', getCanceledOrdersByUser);
router.delete('/order/:canceledOrderId', deleteCanceledOrder);

module.exports = router;