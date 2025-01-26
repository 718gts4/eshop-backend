require("dotenv").config();
const mongoose = require("mongoose");
const VendorSupportQuery = require("../models/vendor-support-query");

mongoose
    .connect(process.env.CONNECTION_STRING, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("Could not connect to MongoDB", err));

async function cleanupData() {
    try {
        // Get counts before deletion
        const queries = await VendorSupportQuery.find()
        const queryCount = queries.length
        const messageCount = queries.reduce((sum, q) => sum + q.messages.length, 0)
        const participantCount = queries.reduce((sum, q) => sum + q.participants.length, 0)
        
        console.log(`Found:`)
        console.log(`- ${queryCount} vendor support queries`)
        console.log(`- ${messageCount} messages`)
        console.log(`- ${participantCount} participants`)

        // Delete all documents
        const result = await VendorSupportQuery.deleteMany({})
        console.log(`\nDeleted ${result.deletedCount} vendor support queries (including all messages and participants)`)

    } catch (error) {
        console.error("Error during cleanup:", error)
    } finally {
        await mongoose.connection.close()
    }
}

cleanupData()
    .then(() => console.log("Cleanup completed"))
    .catch((error) => console.error("Unhandled error during cleanup:", error));