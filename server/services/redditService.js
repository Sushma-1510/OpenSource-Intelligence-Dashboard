const axios = require('axios');
const RedditPost = require('../models/RedditPost');
const Favorite = require('../models/Favorite');
const SyncLog = require('../models/SyncLog');
const { updateSyncTimestamp, isCacheExpired } = require('../utils/cacheManager');
const { validateRedditPost } = require('../utils/validators');
const logger = require('../middleware/logger');

const SUBREDDITS = ['opensource', 'programming', 'javascript', 'reactjs', 'webdev'];

// Retention policy: Reddit "hot" posts go stale fast. Posts older than this
// are purged on each sync unless the user has bookmarked them.
const RETENTION_DAYS = Number(process.env.REDDIT_RETENTION_DAYS) || 30;

/** Maps a raw Reddit API child to our RedditPost shape. */
const mapRedditPost = (data, subreddit) => ({
  title: data.title,
  author: data.author || '[deleted]',
  subreddit: subreddit.toLowerCase(),
  upvotes: typeof data.score === 'number' ? data.score : 0,
  comments: data.num_comments || 0,
  postUrl: data.permalink ? `https://www.reddit.com${data.permalink}` : '',
  thumbnail: data.thumbnail && data.thumbnail.startsWith('http') ? data.thumbnail : '',
  createdAt: new Date(data.created_utc * 1000),
  lastSyncedAt: new Date(),
});

class RedditService {
  /**
   * Fetches hot posts from the configured subreddits concurrently, validates
   * them, bulk-upserts into MongoDB, applies the retention policy and records
   * the run in SyncLog. One failing subreddit does not fail the whole run.
   */
  async syncRedditData() {
    const startedAt = new Date();
    const stats = { fetched: 0, upserted: 0, rejected: 0, purged: 0, rejectionSamples: [] };
    const failedSubs = [];
    logger.info(`[RedditService] Starting Reddit sync for subreddits: ${SUBREDDITS.join(', ')}...`);

    const headers = {
      'User-Agent': process.env.REDDIT_USER_AGENT || 'OpenSourceDashboard/1.0.0',
    };

    try {
      await Promise.all(
        SUBREDDITS.map(async (subreddit) => {
          try {
            const response = await axios.get(`https://www.reddit.com/r/${subreddit}/hot.json`, {
              headers,
              timeout: 15000,
              params: { limit: 25 },
            });

            const children = response.data?.data?.children || [];
            stats.fetched += children.length;

            const valid = [];
            for (const child of children) {
              if (!child?.data) continue;
              const record = mapRedditPost(child.data, subreddit);
              const errors = validateRedditPost(record);
              if (errors.length) {
                stats.rejected += 1;
                if (stats.rejectionSamples.length < 5) {
                  stats.rejectionSamples.push(`r/${subreddit}: ${errors.join(', ')}`);
                }
              } else {
                valid.push(record);
              }
            }

            if (valid.length) {
              const result = await RedditPost.bulkWrite(
                valid.map((p) => ({
                  updateOne: { filter: { postUrl: p.postUrl }, update: { $set: p }, upsert: true },
                })),
                { ordered: false }
              );
              stats.upserted += (result.upsertedCount || 0) + (result.matchedCount || 0);
            }
            logger.info(`[RedditService] /r/${subreddit}: ${valid.length} saved.`);
          } catch (subErr) {
            failedSubs.push(subreddit);
            logger.error(`[RedditService] Failed to sync /r/${subreddit}: ${subErr.message}`);
          }
        })
      );

      stats.purged = await this.applyRetentionPolicy();
      await updateSyncTimestamp('reddit');

      let status = 'success';
      if (failedSubs.length === SUBREDDITS.length) status = 'failed';
      else if (failedSubs.length || stats.rejected) status = 'partial';
      await this.#writeLog(status, startedAt, stats, failedSubs.length ? `failed: ${failedSubs.join(', ')}` : '');

      logger.info(`[RedditService] Sync done: ${stats.upserted} saved, ${stats.rejected} rejected, ${stats.purged} purged.`);
      return stats;
    } catch (err) {
      logger.error(`[RedditService] Error in sync process: ${err.message}`);
      await this.#writeLog('failed', startedAt, stats, err.message);
      throw err;
    }
  }

  /** Deletes posts older than RETENTION_DAYS that are not bookmarked. */
  async applyRetentionPolicy() {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 86400000);
    const keepIds = await Favorite.find({ itemType: 'RedditPost' }).distinct('itemId');
    const { deletedCount } = await RedditPost.deleteMany({
      createdAt: { $lt: cutoff },
      _id: { $nin: keepIds },
    });
    return deletedCount || 0;
  }

  async #writeLog(status, startedAt, stats, error = '') {
    try {
      const finishedAt = new Date();
      await SyncLog.create({
        source: 'reddit',
        status,
        startedAt,
        finishedAt,
        durationMs: finishedAt - startedAt,
        ...stats,
        error,
      });
    } catch (e) {
      logger.error(`[RedditService] Could not write sync log: ${e.message}`);
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
module.exports.mapRedditPost = mapRedditPost;
