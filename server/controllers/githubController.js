const Repository = require('../models/Repository');
const Favorite = require('../models/Favorite');
const githubService = require('../services/githubService');
const logger = require('../middleware/logger');

/**
 * Controller to handle GitHub repository endpoints.
 */
class GitHubController {
  /**
   * Retrieves repositories based on filters, search query, sorting, and pagination.
   * Route: GET /api/github/repositories
   */
  async getRepositories(req, res, next) {
    try {
      // Ensure data is cached and fresh (non-blocking if already loaded once)
      await githubService.ensureDataFreshness();

      const {
        search,
        language,
        minStars,
        maxStars,
        minForks,
        sort = 'stars',
        order = 'desc',
        page = 1,
        limit = 10,
      } = req.query;

      // Build MongoDB query
      const query = {};

      // Search filters
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { fullName: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      if (language) {
        query.language = { $regex: new RegExp(`^${language}$`, 'i') };
      }

      if (minStars || maxStars) {
        query.stars = {};
        if (minStars) query.stars.$gte = parseInt(minStars);
        if (maxStars) query.stars.$lte = parseInt(maxStars);
      }

      if (minForks) {
        query.forks = { $gte: parseInt(minForks) };
      }

      // Sorting map
      const validSortFields = ['stars', 'forks', 'updatedAt', 'issues', 'trendingScore'];
      const sortField = validSortFields.includes(sort) ? sort : 'stars';
      const sortOrder = order === 'asc' ? 1 : -1;
      const sortQuery = { [sortField]: sortOrder };

      // Pagination
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.max(1, parseInt(limit));
      const skipNum = (pageNum - 1) * limitNum;

      // Execute queries in parallel for better performance
      const [repos, total] = await Promise.all([
        Repository.find(query)
          .sort(sortQuery)
          .skip(skipNum)
          .limit(limitNum)
          .lean(),
        Repository.countDocuments(query),
      ]);

      // Check which repos are favorited by this user (mock multi-user via global favorite check)
      const favoriteIds = await Favorite.find({ itemType: 'Repository' }).distinct('itemId');
      const favoriteSet = new Set(favoriteIds.map(id => id.toString()));

      const enrichedRepos = repos.map(repo => ({
        ...repo,
        isFavorite: favoriteSet.has(repo._id.toString()),
      }));

      res.status(200).json({
        success: true,
        count: enrichedRepos.length,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        data: enrichedRepos,
      });
    } catch (error) {
      logger.error(`[GitHubController] Error fetching repositories: ${error.message}`);
      next(error);
    }
  }

  /**
   * Retrieves trending repositories based on high trendingScore.
   * Route: GET /api/github/trending
   */
  async getTrending(req, res, next) {
    try {
      await githubService.ensureDataFreshness();

      const limit = parseInt(req.query.limit) || 10;
      
      const repos = await Repository.find({})
        .sort({ trendingScore: -1 })
        .limit(limit)
        .lean();

      const favoriteIds = await Favorite.find({ itemType: 'Repository' }).distinct('itemId');
      const favoriteSet = new Set(favoriteIds.map(id => id.toString()));

      const enrichedRepos = repos.map(repo => ({
        ...repo,
        isFavorite: favoriteSet.has(repo._id.toString()),
      }));

      res.status(200).json({
        success: true,
        count: enrichedRepos.length,
        data: enrichedRepos,
      });
    } catch (error) {
      logger.error(`[GitHubController] Error fetching trending repos: ${error.message}`);
      next(error);
    }
  }

  /**
   * Toggles the favorite bookmark state of a repository.
   * Route: POST /api/github/favorites
   */
  async toggleFavorite(req, res, next) {
    try {
      const { repositoryId } = req.body;
      if (!repositoryId) {
        return res.status(400).json({ success: false, error: 'repositoryId is required.' });
      }

      // Verify repo exists
      const repo = await Repository.findById(repositoryId);
      if (!repo) {
        return res.status(404).json({ success: false, error: 'Repository not found.' });
      }

      const existingFav = await Favorite.findOne({ itemId: repositoryId, itemType: 'Repository' });

      if (existingFav) {
        await Favorite.deleteOne({ _id: existingFav._id });
        return res.status(200).json({ success: true, bookmarked: false, message: 'Removed from bookmarks.' });
      } else {
        await Favorite.create({ itemId: repositoryId, itemType: 'Repository' });
        return res.status(200).json({ success: true, bookmarked: true, message: 'Added to bookmarks.' });
      }
    } catch (error) {
      logger.error(`[GitHubController] Error toggling favorite repository: ${error.message}`);
      next(error);
    }
  }

  /**
   * Retrieves bookmarked repositories.
   * Route: GET /api/github/favorites
   */
  async getFavorites(req, res, next) {
    try {
      const favorites = await Favorite.find({ itemType: 'Repository' }).populate({
        path: 'itemId',
        model: 'Repository'
      }).lean();

      // Filter out orphaned references if repositories were updated/deleted
      const bookmarkedRepos = favorites
        .filter(fav => fav.itemId)
        .map(fav => ({
          ...fav.itemId,
          isFavorite: true,
        }));

      res.status(200).json({
        success: true,
        count: bookmarkedRepos.length,
        data: bookmarkedRepos,
      });
    } catch (error) {
      logger.error(`[GitHubController] Error getting favorite repositories: ${error.message}`);
      next(error);
    }
  }

  /**
   * Exports repository data.
   * Route: GET /api/github/export
   */
  async exportRepositories(req, res, next) {
    try {
      const format = req.query.format || 'json';
      const repos = await Repository.find({}).sort({ stars: -1 }).lean();

      if (format.toLowerCase() === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=repositories.csv');

        // CSV Header
        const fields = ['Name', 'Full Name', 'Description', 'Stars', 'Forks', 'Open Issues', 'Language', 'Owner', 'URL', 'Created At'];
        let csvContent = fields.join(',') + '\n';

        repos.forEach(repo => {
          const row = [
            `"${repo.name.replace(/"/g, '""')}"`,
            `"${repo.fullName.replace(/"/g, '""')}"`,
            `"${(repo.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
            repo.stars,
            repo.forks,
            repo.issues,
            `"${repo.language}"`,
            `"${repo.owner}"`,
            `"${repo.repoUrl}"`,
            repo.createdAt.toISOString()
          ];
          csvContent += row.join(',') + '\n';
        });

        return res.status(200).send(csvContent);
      }

      // Default to JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=repositories.json');
      return res.status(200).json(repos);
    } catch (error) {
      logger.error(`[GitHubController] Error exporting repositories: ${error.message}`);
      next(error);
    }
  }

  /**
   * Fetches and decodes the README file of a repository from GitHub API.
   * Route: GET /api/github/repositories/:id/readme
   */
  async getReadme(req, res, next) {
    try {
      const { id } = req.params;
      const repo = await Repository.findById(id);
      if (!repo) {
        return res.status(404).json({ success: false, error: 'Repository not found.' });
      }

      logger.info(`[GitHubController] Fetching README for: ${repo.fullName}`);

      const headers = {
        'User-Agent': 'OSINT-Dashboard-App/1.0.0',
        'Accept': 'application/vnd.github.v3+json',
      };

      const axios = require('axios'); // Ensure axios is imported or loaded locally

      if (process.env.GITHUB_TOKEN) {
        headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
      }

      try {
        const response = await axios.get(`https://api.github.com/repos/${repo.owner}/${repo.name}/readme`, { headers });
        const readmeContent = Buffer.from(response.data.content, 'base64').toString('utf8');

        return res.status(200).json({
          success: true,
          readme: readmeContent,
          fullName: repo.fullName
        });
      } catch (apiErr) {
        logger.error(`[GitHubController] Failed to fetch raw README from API: ${apiErr.message}`);
        // Fallback placeholder if README doesn't exist
        return res.status(200).json({
          success: true,
          readme: `# ${repo.name}\n\nNo README could be retrieved from GitHub for this project. Check out the project homepage here: [${repo.repoUrl}](${repo.repoUrl})`,
          fullName: repo.fullName
        });
      }
    } catch (error) {
      logger.error(`[GitHubController] Error in getReadme: ${error.message}`);
      next(error);
    }
  }

  /**
   * Fetches repository details and README live from GitHub API.
   * Route: GET /api/github/repository/live
   */
  async getLiveRepository(req, res, next) {
    try {
      const { name } = req.query;
      if (!name) {
        return res.status(400).json({ success: false, error: 'Repository name is required.' });
      }

      logger.info(`[GitHubController] Fetching live repository: ${name}`);

      const headers = {
        'User-Agent': 'OSINT-Dashboard-App/1.0.0',
        'Accept': 'application/vnd.github.v3+json',
      };

      if (process.env.GITHUB_TOKEN) {
        headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
      }

      const axios = require('axios');
      let targetRepoFullName = name.trim();

      // If it doesn't contain a slash, perform a search to get the top matching repo
      if (!targetRepoFullName.includes('/')) {
        try {
          const searchRes = await axios.get(
            `https://api.github.com/search/repositories?q=${encodeURIComponent(targetRepoFullName)}&sort=stars&order=desc`,
            { headers }
          );
          if (!searchRes.data.items || searchRes.data.items.length === 0) {
            return res.status(404).json({ success: false, error: `No repository found matching "${name}".` });
          }
          targetRepoFullName = searchRes.data.items[0].full_name;
        } catch (searchErr) {
          logger.error(`[GitHubController] Live search failed for "${name}": ${searchErr.message}`);
          return res.status(500).json({ success: false, error: `GitHub search failed: ${searchErr.response?.data?.message || searchErr.message}` });
        }
      }

      const [owner, repoName] = targetRepoFullName.split('/');
      if (!owner || !repoName) {
        return res.status(400).json({ success: false, error: 'Invalid repository name format. Use "owner/repo" or a search keyword.' });
      }

      try {
        const [repoDetailsRes, readmeRes] = await Promise.allSettled([
          axios.get(`https://api.github.com/repos/${owner}/${repoName}`, { headers }),
          axios.get(`https://api.github.com/repos/${owner}/${repoName}/readme`, { headers })
        ]);

        if (repoDetailsRes.status === 'rejected') {
          const errorMsg = repoDetailsRes.reason.response?.data?.message || repoDetailsRes.reason.message;
          return res.status(404).json({ success: false, error: `Repository "${targetRepoFullName}" not found: ${errorMsg}` });
        }

        const repoData = repoDetailsRes.value.data;
        let readmeContent = `# ${repoData.name}\n\nNo README could be retrieved from GitHub for this project. Check out the project homepage here: [${repoData.html_url}](${repoData.html_url})`;

        if (readmeRes.status === 'fulfilled') {
          readmeContent = Buffer.from(readmeRes.value.data.content, 'base64').toString('utf8');
        }

        const result = {
          success: true,
          name: repoData.name,
          fullName: repoData.full_name,
          owner: repoData.owner?.login || owner,
          stars: repoData.stargazers_count,
          forks: repoData.forks_count,
          description: repoData.description || 'No description provided.',
          repoUrl: repoData.html_url,
          language: repoData.language || 'Unknown',
          readme: readmeContent,
          issues: repoData.open_issues_count
        };

        // Upsert to MongoDB cache
        try {
          const updatedDoc = await Repository.findOneAndUpdate(
            { fullName: result.fullName },
            {
              name: result.name,
              fullName: result.fullName,
              owner: result.owner,
              description: result.description,
              stars: result.stars,
              forks: result.forks,
              issues: result.issues,
              language: result.language,
              repoUrl: result.repoUrl,
              createdAt: new Date(repoData.created_at)
            },
            { upsert: true, new: true }
          );
          // Set _id on result for bookmarks compatibility
          result._id = updatedDoc._id;
        } catch (dbErr) {
          logger.error(`[GitHubController] Failed to upsert live repo to DB: ${dbErr.message}`);
        }

        return res.status(200).json(result);
      } catch (err) {
        logger.error(`[GitHubController] Live fetch failed for "${targetRepoFullName}": ${err.message}`);
        return res.status(500).json({ success: false, error: err.message });
      }
    } catch (error) {
      logger.error(`[GitHubController] Error in getLiveRepository: ${error.message}`);
      next(error);
    }
  }
}

module.exports = new GitHubController();
