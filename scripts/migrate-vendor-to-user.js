require("dotenv").config();
const connectToDatabase = require("../config/database");
const mongoose = require("mongoose");
const { User } = require("../models/user");

connectToDatabase()
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("Could not connect to MongoDB", err));

async function migrateData() {
    const vendors = await Vendor.find({});

    const savePromises = vendors.map(async (vendor) => {
        const user = await User.findById(vendor.userId);
        
        if (!user) {
            console.log(`No user found for vendor ${vendor._id}`);
            return;
        }

        user.vendor = vendor.toObject();
        user.role = 'admin';

        return user.save();
    });

    await Promise.all(savePromises);
    console.log("All vendors migrated to users");
}

migrateData().then(() => {
    console.log("Migration completed");
    mongoose.connection.close();
}).catch((error) => {
    console.error("Error during migration:", error);
    mongoose.connection.close();
});
