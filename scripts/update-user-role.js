require("dotenv").config();
const mongoose = require("../config/database");
const { User } = require("../models/user");

async function updateUserRole() {
    try {
        const user = await User.findOne({ email: "v2@gmail.com" });

        if (!user) {
            console.log("User with email v2@gmail.com not found");
            return;
        }

        if (user.role === "superAdmin") {
            console.log("User already has superAdmin role");
            return;
        }

        user.role = "superAdmin";
        await user.save();

        console.log(`Updated user ${user._id} role to superAdmin`);
    } catch (error) {
        console.error("Error during user role update:", error);
    } finally {
        await mongoose.connection.close();
    }
}

updateUserRole()
    .then(() => console.log("User role update completed"))
    .catch((error) => console.error("Unhandled error during user role update:", error));
