require("dotenv").config();
const connectToDatabase = require("../config/database");
const mongoose = require("mongoose");
const { User } = require("../models/user");

connectToDatabase();

async function migrateData() {
    // Before deleting the Vendor model, we need to migrate the data to the User model.
    const vendors = await Vendor.find({});

    const promisesVendors = vendors.map(async (vendor) => {
        const user = await User.findById(vendor.userId);

        if (!user) {
            console.log(`No user found for vendor ${vendor._id}`);
            return;
        }

        user.vendor = vendor.toObject();
        user.role = "admin";

        return user.save();
    });

    await Promise.all(promisesVendors);
    console.log("All vendors migrated to users");
}

migrateData()
    .then(() => {
        console.log("Migration completed");
    })
    .catch((error) => {
        console.error("Error during migration:", error);
    })
    .finally(() => {
        mongoose.connection.close();
    });
