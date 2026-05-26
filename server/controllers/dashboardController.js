const Repository = require('../models/Repository');
const RedditPost = require('../models/RedditPost');
const logger = require('../middleware/logger');

/**
 * Controller to handle complex data aggregation and analytical insights.
 */
class DashboardController {
  /**
   * Generates chart datasets and stat totals.
   * Route: GET /api/dashboard/analytics
   */
  async getAnalytics(req, res, next) {
    try {
      const {
        search,
        redditSearch,
        language,
        minStars,
        maxStars,
        minForks,
        subreddit
      } = req.query;

      // Build GitHub Repository filters match query
      const repoQuery = {};
      if (search) {
        repoQuery.$or = [
          { name: { $regex: search, $options: 'i' } },
          { fullName: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      if (language) {
        repoQuery.language = { $regex: new RegExp(`^${language}$`, 'i') };
      }
      if (minStars || maxStars) {
        repoQuery.stars = {};
        if (minStars) repoQuery.stars.$gte = parseInt(minStars);
        if (maxStars) repoQuery.stars.$lte = parseInt(maxStars);
      }
      if (minForks) {
        repoQuery.forks = { $gte: parseInt(minForks) };
      }

      // Build Reddit Post filters match query
      const redditQuery = {};
      if (redditSearch) {
        redditQuery.$or = [
          { title: { $regex: redditSearch, $options: 'i' } },
          { author: { $regex: redditSearch, $options: 'i' } }
        ];
      }
      if (subreddit) {
        redditQuery.subreddit = subreddit.toLowerCase().trim();
      }

      logger.info(`[DashboardController] Compiling aggregation charts with filters - Repos: ${JSON.stringify(repoQuery)}, Reddit: ${JSON.stringify(redditQuery)}`);

      // 1. General Stats (Totals)
      const repoStats = await Repository.aggregate([
        { $match: repoQuery },
        {
          $group: {
            _id: null,
            totalStars: { $sum: '$stars' },
            totalForks: { $sum: '$forks' },
            totalCount: { $sum: 1 },
          }
        }
      ]);

      const redditStats = await RedditPost.aggregate([
        { $match: redditQuery },
        {
          $group: {
            _id: null,
            totalPosts: { $sum: 1 },
          }
        }
      ]);

      const totals = {
        totalRepositories: repoStats[0]?.totalCount || 0,
        totalStars: repoStats[0]?.totalStars || 0,
        totalForks: repoStats[0]?.totalForks || 0,
        totalRedditPosts: redditStats[0]?.totalPosts || 0,
      };

      // 2. Top Languages (Pie Chart data)
      const topLanguages = await Repository.aggregate([
        { $match: repoQuery },
        {
          $group: {
            _id: '$language',
            count: { $sum: 1 },
            avgStars: { $avg: '$stars' },
            totalStars: { $sum: '$stars' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 8 }
      ]);

      const formattedLanguages = topLanguages.map(item => ({
        language: item._id === 'Unknown' ? 'Other' : item._id,
        count: item.count,
        avgStars: Math.round(item.avgStars),
        totalStars: item.totalStars,
      }));

      // Set "Most Popular Language" for Stats Cards
      totals.mostPopularLanguage = formattedLanguages[0]?.language || 'N/A';

      // 3. Stars Distribution (Bar Chart data)
      const starsDistribution = await Repository.aggregate([
        { $match: repoQuery },
        {
          $bucket: {
            groupBy: '$stars',
            boundaries: [1000, 5000, 10000, 25000, 50000, 100000, 1000000],
            default: '1M+ Stars',
            output: {
              count: { $sum: 1 }
            }
          }
        }
      ]);

      const starRanges = {
        '1k - 5k': 0,
        '5k - 10k': 0,
        '10k - 25k': 0,
        '25k - 50k': 0,
        '50k - 100k': 0,
        '100k+': 0
      };

      starsDistribution.forEach(bucket => {
        if (bucket._id === 1000) starRanges['1k - 5k'] = bucket.count;
        else if (bucket._id === 5000) starRanges['5k - 10k'] = bucket.count;
        else if (bucket._id === 10000) starRanges['10k - 25k'] = bucket.count;
        else if (bucket._id === 25000) starRanges['25k - 50k'] = bucket.count;
        else if (bucket._id === 50000) starRanges['50k - 100k'] = bucket.count;
        else starRanges['100k+'] += bucket.count;
      });

      const formattedStarsDist = Object.keys(starRanges).map(key => ({
        range: key,
        repositories: starRanges[key]
      }));

      // 4. Repository Creation Growth Trend (Line Chart data)
      const creationTrend = await Repository.aggregate([
        { $match: repoQuery },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 } // last 12 chronological month buckets
      ]);

      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const formattedTrend = creationTrend.map(item => ({
        date: `${monthNames[item._id.month - 1]} ${item._id.year}`,
        count: item.count
      }));

      // 5. Most Active Subreddits (Bar/Polar Area Chart data)
      const activeSubreddits = await RedditPost.aggregate([
        { $match: redditQuery },
        {
          $group: {
            _id: '$subreddit',
            postsCount: { $sum: 1 },
            totalUpvotes: { $sum: '$upvotes' },
            totalComments: { $sum: '$comments' }
          }
        },
        { $sort: { postsCount: -1 } }
      ]);

      const formattedSubs = activeSubreddits.map(item => ({
        subreddit: `r/${item._id}`,
        posts: item.postsCount,
        upvotes: item.totalUpvotes,
        comments: item.totalComments,
      }));

      // Set "Most Active Subreddit" for Stats Cards
      totals.mostActiveSubreddit = formattedSubs[0]?.subreddit || 'N/A';

      res.status(200).json({
        success: true,
        stats: totals,
        charts: {
          languages: formattedLanguages,
          starsDistribution: formattedStarsDist,
          growthTrend: formattedTrend,
          subreddits: formattedSubs,
        }
      });
    } catch (error) {
      logger.error(`[DashboardController] Error creating analytics: ${error.message}`);
      next(error);
    }
  }

  /**
   * Analyzes current stored records and generates high-value technical insights.
   * Route: GET /api/dashboard/insights
   */
  async getInsights(req, res, next) {
    try {
      const {
        search,
        redditSearch,
        language,
        minStars,
        maxStars,
        minForks,
        subreddit
      } = req.query;

      // Build GitHub Repository filters match query
      const repoQuery = {};
      if (search) {
        repoQuery.$or = [
          { name: { $regex: search, $options: 'i' } },
          { fullName: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      if (language) {
        repoQuery.language = { $regex: new RegExp(`^${language}$`, 'i') };
      }
      if (minStars || maxStars) {
        repoQuery.stars = {};
        if (minStars) repoQuery.stars.$gte = parseInt(minStars);
        if (maxStars) repoQuery.stars.$lte = parseInt(maxStars);
      }
      if (minForks) {
        repoQuery.forks = { $gte: parseInt(minForks) };
      }

      // Build Reddit Post filters match query
      const redditQuery = {};
      if (redditSearch) {
        redditQuery.$or = [
          { title: { $regex: redditSearch, $options: 'i' } },
          { author: { $regex: redditSearch, $options: 'i' } }
        ];
      }
      if (subreddit) {
        redditQuery.subreddit = subreddit.toLowerCase().trim();
      }

      logger.info(`[DashboardController] Compiling heuristic insights with filters - Repos: ${JSON.stringify(repoQuery)}, Reddit: ${JSON.stringify(redditQuery)}`);

      // 1. Language dominance
      const topLang = await Repository.aggregate([
        { $match: repoQuery },
        { $group: { _id: '$language', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ]);

      // 2. React dominance check
      const reactCount = await Repository.countDocuments({
        ...repoQuery,
        $or: [
          { name: /react/i },
          { description: /react/i },
          { topics: 'react' }
        ]
      });
      const totalRepos = await Repository.countDocuments(repoQuery);
      const reactPercentage = totalRepos > 0 ? Math.round((reactCount / totalRepos) * 100) : 0;

      // 3. AI / LLM popularity check in Reddit discussions
      const aiRedditCount = await RedditPost.countDocuments({
        ...redditQuery,
        title: { $regex: /(ai|artificial intelligence|llm|gpt|claude|openai|copilot|machine learning|deep learning)/i }
      });
      const totalReddit = await RedditPost.countDocuments(redditQuery);
      const aiPercentage = totalReddit > 0 ? Math.round((aiRedditCount / totalReddit) * 100) : 0;

      // Compile insights list
      const insights = [];

      if (topLang.length > 0 && topLang[0]._id !== 'Unknown') {
        insights.push({
          type: 'language',
          title: 'Language Dominance',
          description: `Most trending open-source projects are written in ${topLang[0]._id}, showing its central position in current development workflows.`
        });
      } else {
        insights.push({
          type: 'language',
          title: 'Diverse Language Distribution',
          description: 'GitHub repositories exhibit a highly distributed range of languages without a single dominant stack.'
        });
      }

      if (reactPercentage > 15) {
        insights.push({
          type: 'framework',
          title: 'React Ecosystem Dominance',
          description: `Approximately ${reactPercentage}% of highly starred repositories relate directly to the React ecosystem, confirming its strong popularity among frontend developers.`
        });
      } else {
        insights.push({
          type: 'framework',
          title: 'Modern Stack Diversity',
          description: 'Frontend and tooling ecosystems are expanding beyond React, displaying significant traction for multiple framework strategies.'
        });
      }

      if (aiPercentage > 10) {
        insights.push({
          type: 'trend',
          title: 'Surging Interest in Artificial Intelligence',
          description: `Over ${aiPercentage}% of discussions in developer subreddits focus on AI, LLMs, and automation, highlighting key community interest around AI-driven solutions.`
        });
      } else {
        insights.push({
          type: 'trend',
          title: 'Stable Generalist Topics',
          description: 'Online open-source discussions continue to focus on foundational topics like web standards, language tools, and compiler designs.'
        });
      }

      res.status(200).json({
        success: true,
        count: insights.length,
        data: insights
      });
    } catch (error) {
      logger.error(`[DashboardController] Error generating insights: ${error.message}`);
      next(error);
    }
  }
}

module.exports = new DashboardController();
