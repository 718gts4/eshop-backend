require("dotenv").config();
const mongoose = require("../config/database");
const { User } = require("../models/user");

async function updateUserRole() {
    try {
        const user = await User.findOne({ email: "q4@mail.com" });

        if (!user) {
            console.log("User with email q4@mail.com not found");
            return;
        }

        // if (user.role === newRole) {
        //     console.log(`User already has ${newRole} role`);
        //     return;
        // }
        const newRole = 'admin'

        user.role = newRole;
        user.name = "ytrwarew";
        user.verified=true// unverified users do not have access to admin
        await user.save();

        console.log(`Updated user ${user?.email} role to ${newRole}`);
    } catch (error) {
        console.error("Error during user role update:", error);
    } finally {
        await mongoose.connection.close();
    }
}

updateUserRole()
    .then(() => console.log("User role update completed"))
    .catch((error) => console.error("Unhandled error during user role update:", error));
