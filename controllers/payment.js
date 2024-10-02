// controllers/paymentController.js
const iamportService = require('../services/iamportService');

// Controller function to handle payment verification
exports.verifyPayment = async (req, res) => {
  const { imp_uid, merchant_uid } = req.body; // Extract data from the request body

  try {
    // Use the service to verify payment with Iamport
    const paymentInfo = await iamportService.verifyPayment(imp_uid);

    // Check if the payment was successful
    if (paymentInfo.status === 'paid') {
      // Save payment to DB or any additional processing here
      console.log('Payment verified:', paymentInfo);

      // Respond to frontend with success
      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        paymentInfo: paymentInfo,
      });
    } else {
      // Payment failed or not completed
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        paymentInfo: paymentInfo,
      });
    }
  } catch (error) {
    // Error during payment verification
    console.error('Error verifying payment:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while verifying the payment',
      error: error.message,
    });
  }
};
