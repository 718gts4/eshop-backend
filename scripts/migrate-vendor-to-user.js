require("dotenv").config();
const mongoose = require("mongoose");
const { User } = require("../models/user");
const { Vendor } = require("../models/vendor");

mongoose
    .connect(process.env.CONNECTION_STRING, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
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

        user.vendor = {
            bank: vendor.bank,
            bankHistory: vendor.bankHistory,
            document: vendor.document,
            documentHistory: vendor.documentHistory,
            clients: vendor.clients,
            confirmed: vendor.confirmed,
            contacts: vendor.contacts,
            deliveryAddress: vendor.deliveryAddress,
            pending: vendor.pending,
            submitted: vendor.submitted,
        };

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
