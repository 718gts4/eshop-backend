// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const {verifyPayment} = require('../controllers/payment');

// Define a POST route to verify payment
router.post('/verify', verifyPayment);

module.exports = router;
