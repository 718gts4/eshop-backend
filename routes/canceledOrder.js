const express = require('express');
const router = express.Router();
const { requireSignin, adminMiddleware } = require('../common-middleware');
const {createCanceledOrder} = require('../controllers/canceledOrder');

router.post('/canceledorders', createCanceledOrder);

module.exports = router;