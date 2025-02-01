const mongoose = require('mongoose');
const { SuperAdminQuestion } = require('../models/superadmin-question');

async function migrateReadStatus() {
  try {
    console.log('Starting read status migration...');
    
    const questions = await SuperAdminQuestion.find()
      .populate('userId', 'role')
      .populate('answers.userId', 'role');
    
    console.log(`Found ${questions.length} questions to migrate`);
    
    for (const question of questions) {
      console.log(`Migrating question ${question._id}`);
      
      // Only migrate the latest answer's read status
      if (question.answers && question.answers.length > 0) {
        const latestAnswer = question.answers[question.answers.length - 1];
        
        // Convert old flags to single isRead field for latest answer
        latestAnswer.isRead = latestAnswer.isReadByAdmin || latestAnswer.isReadBySuperadmin;
        
        // Remove old fields from latest answer
        latestAnswer.isReadByAdmin = undefined;
        latestAnswer.isReadBySuperadmin = undefined;
        latestAnswer.isReadByUser = undefined;
        
        // Keep repliedBySuperadmin flag for mobile compatibility
        // It's already at the question level, no need to modify
      }
      
      await question.save();
      console.log(`Migrated question ${question._id}`);
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Only run if called directly
if (require.main === module) {
  // Connect to MongoDB
  mongoose.connect(process.env.MONGODB_URL)
    .then(() => {
      console.log('Connected to MongoDB');
      return migrateReadStatus();
    })
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = migrateReadStatus;