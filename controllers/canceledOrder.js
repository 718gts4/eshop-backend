const { CanceledOrder } = require('../models/canceledOrder'); // Import the CanceledOrder model

exports.createCanceledOrder = async (req, res) => {
    try {
        const {
            orderItemId,
            product,
            canceledBy,
            reasonForCancellation,
            refundAmount,
            status,
            vendor,
            orderNumber,
        } = req.body;

        const existingCanceledItem = await CanceledOrder.findOne({canceledBy, orderItemId})
        if (existingCanceledItem) {
            return res.status(400).json({
                success: false,
                message: 'A canceled order for this product and user already exists.',
            });
        }
        // Create a new canceled order document
        const canceledOrder = new CanceledOrder({
            orderItemId,
            product,
            canceledBy,
            reasonForCancellation,
            refundAmount,
            status,
            vendor,
            orderNumber,
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
        
        const canceledOrders = await CanceledOrder.find({ canceledBy: userId })
            .populate('product')
            .sort({'dateCreated': -1});
    
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

exports.deleteCanceledOrder = async (req, res) => {
    try {
        const { canceledOrderId } = req.params; 
        
        // Use Mongoose to find the canceled order by its ID and remove it
        const deletedCanceledOrder = await CanceledOrder.findByIdAndRemove(canceledOrderId);
    
        if (!deletedCanceledOrder) {
            // If the canceled order with the provided ID doesn't exist
            return res.status(404).json({
                success: false,
                message: 'Canceled order not found',
            });
        }
    
        // Respond with a success message and the deleted canceled order
        return res.status(200).json({
            success: true,
            message: 'Canceled order deleted successfully',
            canceledOrder: deletedCanceledOrder,
        });
    } catch (error) {
        // Handle any errors and respond with an error message
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete canceled order',
            error: error.message,
        });
    }
};