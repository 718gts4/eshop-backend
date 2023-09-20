const { CanceledOrder } = require('../models/canceledOrder'); // Import the CanceledOrder model

// Create a new canceled order
exports.createCanceledOrder = async (req, res) => {
    try {
        const {
            order,
            canceledBy,
            cancellationDate,
            reasonForCancellation,
            refundAmount,
            status,
        } = req.body;

        // Create a new canceled order document
        const canceledOrder = new CanceledOrder({
            order,
            canceledBy,
            cancellationDate,
            reasonForCancellation,
            refundAmount,
            status,
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

exports.getCanceledOrdersByUser = async (req, res) => {
    try {
        const { userId } = req.params; // Assuming you pass the user ID as a route parameter
        
        const canceledOrders = await CanceledOrder.find({ canceledBy: userId });
    
        return res.status(200).json({
            success: true,
            canceledOrders,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve canceled orders',
            error: error.message,
        });
    }
};
