const axios = require('axios');
const Repository = require('../models/Repository');
const RepoSnapshot = require('../models/RepoSnapshot');
const { startOfUtcDay } = require('../models/RepoSnapshot');
const SyncLog = require('../models/SyncLog');
const { updateSyncTimestamp, isCacheExpired } = require('../utils/cacheManager');
const { calculateTrendingScore } = require('../utils/trendingScore');
const { validateRepository } = require('../utils/validators');
const logger = require('../middleware/logger');

/** Maps a raw GitHub API item to our Repository shape. */
const mapRepository = (repo, now = Date.now()) => ({
  name: repo.name,
  fullName: repo.full_name,
  description: repo.description || '',
  stars: repo.stargazers_count,
  forks: repo.forks_count,
  issues: repo.open_issues_count || 0,
  // Note: in the Search API watchers_count mirrors stargazers_count.
  watchers: repo.watchers_count || 0,
  license: repo.license ? repo.license.spdx_id || repo.license.name : 'None',
  language: repo.language || 'Unknown',
  topics: repo.topics || [],
  owner: repo.owner?.login,
  avatar: repo.owner?.avatar_url || '',
  repoUrl: repo.html_url,
  createdAt: new Date(repo.created_at),
  updatedAt: new Date(repo.updated_at),
  trendingScore: calculateTrendingScore(
    { stars: repo.stargazers_count, forks: repo.forks_count, updatedAt: repo.updated_at },
    now
  ),
  lastSyncedAt: new Date(now),
});

/**
 * Service to manage GitHub integration.
 */
class GitHubService {
  /**
   * Fetches top repositories from the GitHub Search API, validates them,
   * bulk-upserts into MongoDB, writes a daily snapshot per repo and records
   * the run in SyncLog.
   * @param {number} page - Page number to fetch
   * @param {number} perPage - Items per page (default 50)
   * @returns {Promise<{upserted:number, rejected:number}>}
   */
  async syncGitHubData(page = 1, perPage = 50) {
    const startedAt = new Date();
    const stats = { fetched: 0, upserted: 0, rejected: 0, rejectionSamples: [] };
    logger.info(`[GitHubService] Starting sync for page ${page} (${perPage} items)...`);

    const headers = {
      'User-Agent': 'OpenSourceDashboard/1.0.0',
      'Accept': 'application/vnd.github.v3+json',
    };

    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    } else {
      logger.warn('[GitHubService] No GITHUB_TOKEN set. Unauthenticated requests are limited to 60/hour.');
    }

    try {
      const response = await axios.get('https://api.github.com/search/repositories', {
        headers,
        timeout: 15000,
        params: { q: 'stars:>1000', sort: 'stars', order: 'desc', page, per_page: perPage },
      });

      const rateLimitRemaining = response.headers['x-ratelimit-remaining'];
      const rateLimitReset = response.headers['x-ratelimit-reset'];
      logger.info(`[GitHubService] API Rate Limit Remaining: ${rateLimitRemaining}`);
      if (rateLimitRemaining && parseInt(rateLimitRemaining, 10) < 5) {
        const resetTime = new Date(parseInt(rateLimitReset, 10) * 1000).toLocaleTimeString();
        logger.warn(`[GitHubService] Rate limit is critically low! Reset occurs at: ${resetTime}`);
      }

      const items = response.data.items || [];
      stats.fetched = items.length;

      // Data-quality gate
      const now = Date.now();
      const valid = [];
      for (const item of items) {
        const record = mapRepository(item, now);
        const errors = validateRepository(record);
        if (errors.length) {
          stats.rejected += 1;
          if (stats.rejectionSamples.length < 5) {
            stats.rejectionSamples.push(`${item.full_name || 'unknown'}: ${errors.join(', ')}`);
          }
        } else {
          valid.push(record);
        }
      }

      if (valid.length) {
        // One round-trip instead of one query per repo
        const result = await Repository.bulkWrite(
          valid.map((r) => ({
            updateOne: { filter: { fullName: r.fullName }, update: { $set: r }, upsert: true },
          })),
          { ordered: false }
        );
        // inserted + already-existing (updated) documents
        stats.upserted = (result.upsertedCount || 0) + (result.matchedCount || 0);

        // Daily time-series snapshot (idempotent: re-running today overwrites today's point)
        const day = startOfUtcDay(new Date(now));
        await RepoSnapshot.bulkWrite(
          valid.map((r) => ({
            updateOne: {
              filter: { fullName: r.fullName, day },
              update: {
                $set: { stars: r.stars, forks: r.forks, issues: r.issues, trendingScore: r.trendingScore },
              },
              upsert: true,
            },
          })),
          { ordered: false }
        );
      }

      logger.info(`[GitHubService] Synced ${stats.upserted} repositories (${stats.rejected} rejected).`);
      await updateSyncTimestamp('github');
      await this.#writeLog(stats.rejected ? 'partial' : 'success', startedAt, stats);
      return { upserted: stats.upserted, rejected: stats.rejected };
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        const msg = error.response.data?.message || '';
        logger.error(`[GitHubService] API Request Failed: Status ${status} - ${msg}`);
        if (status === 403 && msg.includes('rate limit')) {
          const resetHeader = error.response.headers['x-ratelimit-reset'];
          const resetTime = resetHeader ? new Date(parseInt(resetHeader, 10) * 1000).toLocaleTimeString() : 'unknown';
          logger.error(`[GitHubService] GitHub API Rate Limit Exceeded. Reset is at ${resetTime}.`);
        }
      } else {
        logger.error(`[GitHubService] Request connection error: ${error.message}`);
      }
      await this.#writeLog('failed', startedAt, stats, error.message);
      throw error;
    }
  }

  async #writeLog(status, startedAt, stats, error = '') {
    try {
      const finishedAt = new Date();
      await SyncLog.create({
        source: 'github',
        status,
        startedAt,
        finishedAt,
        durationMs: finishedAt - startedAt,
        ...stats,
        error,
      });
    } catch (e) {
      logger.error(`[GitHubService] Could not write sync log: ${e.message}`);
    }
  }

  /**
   * Safe getter method that checks cache before triggering sync.
   * Runs cache refresh in background or synchronously based on DB occupancy.
   */
  async ensureDataFreshness() {
    const expired = await isCacheExpired('github');
    const dbCount = await Repository.countDocuments();
    
    if (expired || dbCount === 0) {
      if (dbCount === 0) {
        logger.info('[GitHubService] Database is empty. Performing initial blocking sync...');
        await this.syncGitHubData(1, 50);
      } else {
        logger.info('[GitHubService] GitHub cache expired. Triggering background refresh sync...');
        // Background refresh to avoid blocking current request
        this.syncGitHubData(1, 50).catch(err => {
          logger.error('[GitHubService] Background sync failed:', err.message);
        });
      }
    }
  }
}

module.exports = new GitHubService();
module.exports.mapRepository = mapRepository;
