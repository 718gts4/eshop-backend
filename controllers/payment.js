const axios = require('axios');
const Payment = require('../models/payment');
require('dotenv').config();

const IMP_KEY = process.env.IAMPORT_API_KEY;
const IMP_SECRET = process.env.IAMPORT_API_SECRET;

// Get Iamport access token
const getIamportToken = async () => {
    const response = await axios.post('https://api.iamport.kr/users/getToken', {
        imp_key: IMP_KEY,
        imp_secret: IMP_SECRET,
    });
    return response.data.response.access_token;
};

// Verify payment and store in the database
exports.verifyPayment = async (req, res) => {
    const { imp_uid, merchant_uid, amount } = req.body;

    try {
        // Get Iamport access token
        const access_token = await getIamportToken();

        // Verify payment with Iamport server
        const response = await axios.get(`https://api.iamport.kr/payments/${imp_uid}`, {
            headers: { Authorization: access_token },
        });

        const paymentData = response.data.response;

        // Check if payment amount matches
        if (paymentData.amount !== amount) {
            return res.status(400).json({
                status: 'error',
                message: 'Payment amount mismatch',
            });
        }

        // Save payment to database
        const payment = new Payment({
            imp_uid: paymentData.imp_uid,
            merchant_uid: paymentData.merchant_uid,
            amount: paymentData.amount,
            buyer_name: paymentData.buyer_name,
            buyer_email: paymentData.buyer_email,
            buyer_tel: paymentData.buyer_tel,
            status: 'paid',
        });

        await payment.save();

        res.status(200).json({
            status: 'success',
            message: 'Payment verified and saved successfully',
            payment,
        });

    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to verify payment',
        });
    }
};
