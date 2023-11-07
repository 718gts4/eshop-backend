const { Purchase } = require("../models/purchase");
const mongoose = require("mongoose");

exports.postPurchase = async (req, res) => {
    try {
        const { date, vendor, customer, products, totalAmount, payment } =
            req.body;

        // Create a new Purchase document
        const newPurchase = new Purchase({
            date,
            vendor,
            customer,
            products,
            totalAmount,
            payment,
        });

        // Save the new purchase to the database
        const savedPurchase = await newPurchase.save();

        res.status(201).json(savedPurchase);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating the purchase." });
    }
};
