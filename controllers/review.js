const { Review } = require("../models/review");
const mongoose = require("mongoose");

exports.postReview = async (req, res) => {
    try {
        const { comment, point, productId, userId, vendorId } = req.body;

        // Create a new review instance
        const newReview = new Review({
            comment,
            point,
            productId,
            userId,
            vendorId,
        });

        // Save the review to the database
        await newReview.save();

        res.status(201).json({
            success: true,
            message: "Review posted successfully",
        });
    } catch (error) {
        console.error("Error posting review:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
