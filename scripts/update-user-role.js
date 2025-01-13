require("dotenv").config();
const connectToDatabase = require("../utils/database");
const mongoose = require("mongoose");
const { User } = require("../models/user");

async function updateUserRole({ email, newRole, name }) {
    await connectToDatabase();
    try {
        const user = await User.findOne({ email });

        if (!user) {
            console.log(`User with email ${email} not found`);
            return;
        }

        const isAdmin = newRole === "admin" || newRole === "superAdmin";
        user.role = newRole;
        user.isAdmin = isAdmin;
        name && (user.name = name); // set name if needed
        user.verified = true; // unverified users do not have access to admin

        await user.save();

        console.log(`Updated user ${user.email}:`);
        console.log(`Role: ${user.role}`);
        console.log(`Name: ${user.name}`);
        console.log(`isAdmin: ${user.isAdmin}`); // registers through admin app not mobile app. user registers mobile app as user and then becomes admin admin.
        console.log(`Verified: ${user.verified}`); // manual process
        console.log(`submitted: ${user.submitted}`); // cannot be verified if business documents aren't submitted. automated process
        
        /*
        TODO: a user registers as a user on mobile. 
        He wants to register as admin, which can only be done through admin app.
        But because he is already registered as a user, he cannot register as admin, because his email is already in the system.
        He would have to delete his user account and then register as admin.
        Fix?
        */
    } catch (error) {
        console.error("Error during user role update:", error);
    } finally {
        await mongoose.connection.close();
        console.log("Disconnected from MongoDB");
    }
}

const emails = ["q4@mail.com"]; // array for setting more than one.
const newRole = "superAdmin";
const name = newRole === "admin" ? "ADMIN" : "SUPER ADMIN";

// Set user(s) to admin or superAdmin
Promise.all(emails.map((email) => updateUserRole({ email, newRole, name })))
    .then(() => console.log("All user role updates completed"))
    .catch((error) =>
        console.error("Unhandled error during user role updates:", error)
    );
