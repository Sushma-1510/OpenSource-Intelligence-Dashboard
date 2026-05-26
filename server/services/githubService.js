const axios = require('axios');
const Repository = require('../models/Repository');
const { updateSyncTimestamp, isCacheExpired } = require('../utils/cacheManager');
const logger = require('../middleware/logger');

/**
 * Calculates a repository's trending score based on stars, forks, watchers, and recent activity.
 */
const calculateTrendingScore = (stars, forks, watchers, updatedAtStr) => {
  const updatedAt = new Date(updatedAtStr);
  const diffMs = Date.now() - updatedAt.getTime();
  const diffDays = Math.max(0, diffMs / (1000 * 60 * 60 * 24)); // ensure positive days

  let recentActivity = 0;
  if (diffDays <= 1) recentActivity = 100;
  else if (diffDays <= 7) recentActivity = 75;
  else if (diffDays <= 30) recentActivity = 50;
  else if (diffDays <= 90) recentActivity = 25;
  else recentActivity = 0;

  const score = (stars * 0.5) + (forks * 0.2) + (watchers * 0.2) + (recentActivity * 0.1);
  return parseFloat(score.toFixed(2));
};

/**
 * Service to manage GitHub integration.
 */
class GitHubService {
  /**
   * Fetches top repositories from GitHub search API, parses, and upserts into MongoDB.
   * @param {number} page - Page number to fetch (for syncing more repositories)
   * @param {number} perPage - Items per page (default 50)
   * @returns {Promise<Array>} List of saved repositories
   */
  async syncGitHubData(page = 1, perPage = 50) {
    logger.info(`[GitHubService] Starting sync for page ${page} (${perPage} items)...`);
    
    const headers = {
      'User-Agent': 'OSINT-Dashboard-App/1.0.0',
      'Accept': 'application/vnd.github.v3+json',
    };

    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
      logger.info('[GitHubService] Using authenticated requests with GITHUB_TOKEN.');
    } else {
      logger.warn('[GitHubService] No GITHUB_TOKEN set. Unauthenticated requests are subject to strict rate limits.');
    }

    try {
      const response = await axios.get('https://api.github.com/search/repositories', {
        headers,
        params: {
          q: 'stars:>1000',
          sort: 'stars',
          order: 'desc',
          page,
          per_page: perPage,
        },
      });

      // Handle GitHub API rate-limit headers
      const rateLimitRemaining = response.headers['x-ratelimit-remaining'];
      const rateLimitReset = response.headers['x-ratelimit-reset'];
      logger.info(`[GitHubService] API Rate Limit Remaining: ${rateLimitRemaining}`);
      
      if (rateLimitRemaining && parseInt(rateLimitRemaining) < 5) {
        const resetTime = new Date(parseInt(rateLimitReset) * 1000).toLocaleTimeString();
        logger.warn(`[GitHubService] Rate limit is critically low! Reset occurs at: ${resetTime}`);
      }

      const repos = response.data.items || [];
      logger.info(`[GitHubService] Fetched ${repos.length} repositories from API. Preparing database upsert...`);

      const upsertPromises = repos.map(async (repo) => {
        const score = calculateTrendingScore(
          repo.stargazers_count,
          repo.forks_count,
          repo.watchers_count,
          repo.updated_at
        );

        const repoData = {
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description || '',
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          issues: repo.open_issues_count || 0,
          watchers: repo.watchers_count || 0,
          license: repo.license ? repo.license.spdx_id || repo.license.name : 'None',
          language: repo.language || 'Unknown',
          topics: repo.topics || [],
          owner: repo.owner.login,
          avatar: repo.owner.avatar_url,
          repoUrl: repo.html_url,
          createdAt: new Date(repo.created_at),
          updatedAt: new Date(repo.updated_at),
          trendingScore: score,
          lastSyncedAt: new Date(),
        };

        // Upsert by unique fullName
        return Repository.findOneAndUpdate(
          { fullName: repo.full_name },
          repoData,
          { upsert: true, new: true, runValidators: true }
        );
      });

      const savedRepos = await Promise.all(upsertPromises);
      logger.info(`[GitHubService] Successfully synced and updated ${savedRepos.length} repositories in database.`);
      
      // Update Cache State tracking
      await updateSyncTimestamp('github');
      
      return savedRepos;
    } catch (error) {
      // Robust rate limit and network error handling
      if (error.response) {
        const status = error.response.status;
        const msg = error.response.data?.message || '';
        
        logger.error(`[GitHubService] API Request Failed: Status ${status} - ${msg}`);
        
        if (status === 403 && msg.includes('rate limit')) {
          const resetHeader = error.response.headers['x-ratelimit-reset'];
          const resetTime = resetHeader ? new Date(parseInt(resetHeader) * 1000).toLocaleTimeString() : 'unknown';
          logger.error(`[GitHubService] GitHub API Rate Limit Exceeded. Reset is at ${resetTime}.`);
        }
      } else {
        logger.error(`[GitHubService] Request connection error: ${error.message}`);
      }
      throw error;
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
