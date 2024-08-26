require("dotenv").config();
const mongoose = require("../config/database");
const { User } = require("../models/user");
// const { Vendor } = require("../models/vendor");
const { vendorSchema } = require("../models/vendor");
const Vendor = mongoose.model("Vendor", vendorSchema);

async function migrateData() {
    try {
        const vendors = await Vendor.find({});
        console.log(`Found ${vendors.length} vendors to migrate`);

        for (const vendor of vendors) {
            const user = await User.findById(vendor.userId);

            if (!user) {
                console.log(`No user found for vendor ${vendor._id}`);
                continue;
            }
            if (user) {
                console.log(`User found for vendor ${vendor._id}`);
            }
            user.vendor = vendor.toObject();
            user.role = "admin";

            await user.save();
            console.log(`Migrated vendor ${vendor._id} to user ${user._id}`);
        }

        console.log("All vendors migrated to users");
    } catch (error) {
        console.error("Error during migration:", error);
    } finally {
        await mongoose.connection.close();
    }
}

migrateData()
    .then(() => console.log("Migration completed"))
    .catch((error) => console.error("Unhandled error during migration:", error));
