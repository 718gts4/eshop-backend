const express = require('express');
const router = express.Router();
const { verifyPayment } = require('../controllers/payment');

// POST route to verify payment
router.post('/verify-payment', verifyPayment);

module.exports = router;
