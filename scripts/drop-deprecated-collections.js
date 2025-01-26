const mongoose = require('mongoose')
require('dotenv/config')

async function dropCollections() {
  try {
    const mongoUrl = process.env.CONNECTION_STRING || process.env.MONGODB_URL
    if (!mongoUrl) {
      throw new Error('MongoDB connection string not found in environment variables')
    }

    await mongoose.connect(mongoUrl)
    console.log('Connected to MongoDB')

    const collections = ['adminqueries', 'vendorsupportqueries']
    
    for (const collectionName of collections) {
      try {
        await mongoose.connection.db.dropCollection(collectionName)
        console.log(`✓ Dropped collection: ${collectionName}`)
      } catch (error) {
        if (error.code === 26) { // Collection doesn't exist
          console.log(`Collection ${collectionName} doesn't exist, skipping...`)
        } else {
          console.error(`Error dropping ${collectionName}:`, error.message)
        }
      }
    }

    console.log('All deprecated collections dropped successfully')
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  }
}

dropCollections()
