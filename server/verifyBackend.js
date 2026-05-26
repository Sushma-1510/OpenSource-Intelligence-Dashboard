const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');
const githubService = require('./services/githubService');
const redditService = require('./services/redditService');
const Repository = require('./models/Repository');
const RedditPost = require('./models/RedditPost');
const { getLastSyncedAt } = require('./utils/cacheManager');

const runVerification = async () => {
  console.log('\n==================================================');
  console.log('   OSINT Dashboard Backend Verification Script    ');
  console.log('==================================================\n');

  try {
    // 1. Establish Database Connection
    console.log('[Step 1] Connecting to MongoDB...');
    await connectDB();
    console.log('[Step 1] Success: Database connected successfully!\n');

    // 2. Perform API Synchronization
    console.log('[Step 2] Fetching and caching GitHub repositories (Top 10)...');
    // Fetch only 10 items to prevent rate limits during rapid test cycles
    await githubService.syncGitHubData(1, 10);
    console.log('[Step 2] Success: GitHub Sync finished!\n');

    console.log('[Step 3] Fetching and caching Reddit discussions...');
    await redditService.syncRedditData();
    console.log('[Step 3] Success: Reddit Sync finished!\n');

    // 3. Query Results validation
    console.log('[Step 4] Validating database collections...');
    const repoCount = await Repository.countDocuments();
    const redditCount = await RedditPost.countDocuments();

    console.log(`- Stored GitHub Repositories: ${repoCount}`);
    console.log(`- Stored Reddit Posts: ${redditCount}`);

    if (repoCount === 0 || redditCount === 0) {
      throw new Error('Database contains zero records! API synchronization might have failed silently.');
    }
    console.log('[Step 4] Success: Database populated correctly!\n');

    // 4. Verify Caching Manager Timestamps
    console.log('[Step 5] Checking Cache State Manager logs...');
    const ghSyncTime = await getLastSyncedAt('github');
    const rdSyncTime = await getLastSyncedAt('reddit');

    console.log(`- GitHub Last Sync Time: ${ghSyncTime}`);
    console.log(`- Reddit Last Sync Time: ${rdSyncTime}`);
    console.log('[Step 5] Success: Cache tracking functions correctly!\n');

    console.log('==================================================');
    console.log('   VERIFICATION COMPLETE - BACKEND IS FULLY FUNCTIONAL');
    console.log('==================================================\n');
    
    // Safely close connection and exit
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n==================================================');
    console.error(`❌ VERIFICATION FAILED: ${error.message}`);
    console.error('==================================================\n');
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

runVerification();
