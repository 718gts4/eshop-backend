const { CanceledOrder } = require('../models/canceledOrder'); // Import the CanceledOrder model

// Create a new canceled order
exports.createCanceledOrder = async (req, res) => {
  try {
    // Extract the data from the request body
    const {
        order,
        canceledBy,
        cancellationDate,
        reasonForCancellation,
        refundAmount,
    } = req.body;

    // Create a new canceled order document
    const canceledOrder = new CanceledOrder({
        order,
        canceledBy,
        cancellationDate,
        reasonForCancellation,
        refundAmount,
    });

    // Save the canceled order to the database
    await canceledOrder.save();

    // Respond with a success message and the created canceled order
    return res.status(201).json({
        success: true,
        message: 'Canceled order created successfully',
        canceledOrder,
    });
  } catch (error) {
    // Handle any errors and respond with an error message
    console.error(error);
    return res.status(500).json({
        success: false,
        message: 'Failed to create canceled order',
        error: error.message,
    });
  }
};
