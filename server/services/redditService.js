const axios = require('axios');
const RedditPost = require('../models/RedditPost');
const { updateSyncTimestamp, isCacheExpired } = require('../utils/cacheManager');
const logger = require('../middleware/logger');

const SUBREDDITS = ['opensource', 'programming', 'javascript', 'reactjs', 'webdev'];

class RedditService {
  /**
   * Fetches hot posts from selected subreddits and upserts into MongoDB.
   * Concurrently handles multiple subreddits.
   */
  async syncRedditData() {
    logger.info(`[RedditService] Starting Reddit sync for subreddits: ${SUBREDDITS.join(', ')}...`);

    const headers = {
      'User-Agent': process.env.REDDIT_USER_AGENT || 'OSINT-Dashboard/1.0.0 (by Antigravity)',
    };

    // If developer set API client credentials, we could use OAuth, but Reddit's public .json
    // endpoints are incredibly reliable for public read-only hot posts without credentials.
    try {
      const fetchPromises = SUBREDDITS.map(async (subreddit) => {
        try {
          const url = `https://www.reddit.com/r/${subreddit}/hot.json`;
          logger.info(`[RedditService] Fetching /r/${subreddit} hot posts...`);
          
          const response = await axios.get(url, {
            headers,
            params: {
              limit: 25, // Sync top 25 posts per subreddit
            }
          });

          const posts = response.data?.data?.children || [];
          logger.info(`[RedditService] Received ${posts.length} posts from /r/${subreddit}. Upserting...`);

          const upsertPromises = posts.map(async (p) => {
            const data = p.data;
            if (!data) return;

            // Prepare post data mapping
            const postData = {
              title: data.title,
              author: data.author || 'unknown',
              subreddit: subreddit.toLowerCase(),
              upvotes: data.upsubs || data.score || 0,
              comments: data.num_comments || 0,
              postUrl: `https://www.reddit.com${data.permalink}`,
              thumbnail: data.thumbnail && data.thumbnail.startsWith('http') ? data.thumbnail : '',
              createdAt: new Date(data.created_utc * 1000),
              lastSyncedAt: new Date(),
            };

            // Upsert by permalink (postUrl)
            return RedditPost.findOneAndUpdate(
              { postUrl: postData.postUrl },
              postData,
              { upsert: true, new: true, runValidators: true }
            );
          });

          await Promise.all(upsertPromises);
          logger.info(`[RedditService] /r/${subreddit} sync completed successfully.`);
        } catch (subErr) {
          logger.error(`[RedditService] Failed to sync /r/${subreddit}: ${subErr.message}`);
          // Don't crash the entire sync if a single subreddit fails (resilient coding pattern)
        }
      });

      await Promise.all(fetchPromises);
      
      // Update Cache State tracking
      await updateSyncTimestamp('reddit');
      logger.info('[RedditService] General Reddit posts sync completed.');
    } catch (err) {
      logger.error(`[RedditService] Error in sync process: ${err.message}`);
      throw err;
    }
  }

  /**
   * Safe getter method that checks cache before triggering sync.
   * Runs cache refresh in background or synchronously based on DB occupancy.
   */
  async ensureDataFreshness() {
    const expired = await isCacheExpired('reddit');
    const dbCount = await RedditPost.countDocuments();
    
    if (expired || dbCount === 0) {
      if (dbCount === 0) {
        logger.info('[RedditService] Database is empty. Performing initial blocking Reddit sync...');
        await this.syncRedditData();
      } else {
        logger.info('[RedditService] Reddit cache expired. Triggering background refresh sync...');
        // Background refresh to avoid blocking current request
        this.syncRedditData().catch(err => {
          logger.error('[RedditService] Background Reddit sync failed:', err.message);
        });
      }
    }
  }
}

module.exports = new RedditService();
