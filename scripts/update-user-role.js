require("dotenv").config();
const mongoose = require("../config/database");
const { User } = require("../models/user");

async function updateUserRole() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Connected to MongoDB");

        const user = await User.findOne({ email: "q4@mail.com" });

        if (!user) {
            console.log("User with email q4@mail.com not found");
            return;
        }

        const newRole = 'admin';

        user.role = newRole;
        user.name = "ytrwarew";
        user.verified = true; // unverified users do not have access to admin
        user.emailVerified = new Date(); // Set email as verified

        await user.save();

        console.log(`Updated user ${user.email}:`);
        console.log(`Role: ${user.role}`);
        console.log(`Name: ${user.name}`);
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
    .catch((error) => console.error("Unhandled error during user role update:", error));
