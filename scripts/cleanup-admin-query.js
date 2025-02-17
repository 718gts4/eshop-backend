require("dotenv").config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require("mongoose");
const AdminQuery = require("../models/admin-query");

mongoose
    .connect(process.env.CONNECTION_STRING, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("Could not connect to MongoDB", err));

async function cleanupData() {
    try {
        // Get count before deletion
        const count = await AdminQuery.countDocuments();
        console.log(`Found ${count} admin queries to delete`);

        // Delete all documents
        const result = await AdminQuery.deleteMany({});
        console.log(`Deleted ${result.deletedCount} admin queries`);

    } catch (error) {
        console.error("Error during cleanup:", error);
    } finally {
        await mongoose.connection.close();
    }
}

cleanupData()
    .then(() => console.log("Cleanup completed"))
    .catch((error) => console.error("Unhandled error during cleanup:", error));