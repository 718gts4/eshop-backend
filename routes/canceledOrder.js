const express = require('express');
const router = express.Router();
const { requireSignin, adminMiddleware } = require('../common-middleware');
const {createCanceledOrder, getCanceledOrdersByUser} = require('../controllers/canceledOrder');

router.post('/canceledorders', createCanceledOrder);
router.get('/user/:userId', getCanceledOrdersByUser);

module.exports = router;