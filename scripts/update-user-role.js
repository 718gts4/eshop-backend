require("dotenv").config();
const connectToDatabase = require("../config/database");
const mongoose = require("mongoose");
const { User } = require("../models/user");

async function updateUserRole() {
    connectToDatabase();
    const email = 'q@mail.com';
    try {
        console.log("Connected to MongoDB");

        const user = await User.findOne({ email });

        if (!user) {
            console.log(`"User with email ${email} not found"`);
            return;
        }

        const newRole = "superAdmin";
        const isAdmin = newRole === "admin" || newRole === "superAdmin";
        console.log({ isAdmin });   
        user.role = newRole;
        // user.isAdmin = true;
        // user.name = "ytrwarew";
        // user.verified = true; // unverified users do not have access to admin
        // user.emailVerified = new Date(); // Set email as verified

        await user.save();

        console.log(`Updated user ${user.email}:`);
        console.log(`Role: ${user.role}`);
        console.log(`Name: ${user.name}`);
        console.log(`isAdmin: ${user.isAdmin}`);
        console.log(`Verified: ${user.verified}`);
        console.log(`Email Verified: ${user.emailVerified}`);
    } catch (error) {
        console.error("Error during user role update:", error);
    } finally {
        await mongoose.connection.close();
        console.log("Disconnected from MongoDB");
    }
}

updateUserRole()
    .then(() => console.log("User role update completed"))
    .catch((error) =>
        console.error("Unhandled error during user role update:", error)
    );
