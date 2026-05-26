const RedditPost = require('../models/RedditPost');
const Favorite = require('../models/Favorite');
const redditService = require('../services/redditService');
const logger = require('../middleware/logger');

/**
 * Controller to handle Reddit discussions endpoints.
 */
class RedditController {
  /**
   * Retrieves Reddit posts based on filters, search query, sorting, and pagination.
   * Route: GET /api/reddit/posts
   */
  async getPosts(req, res, next) {
    try {
      // Ensure cache is fresh
      await redditService.ensureDataFreshness();

      const {
        search,
        subreddit,
        sort = 'upvotes',
        order = 'desc',
        page = 1,
        limit = 10,
      } = req.query;

      // Build MongoDB query
      const query = {};

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { author: { $regex: search, $options: 'i' } }
        ];
      }

      if (subreddit) {
        query.subreddit = subreddit.toLowerCase().trim();
      }

      // Sort map
      const validSortFields = ['upvotes', 'comments', 'createdAt'];
      const sortField = validSortFields.includes(sort) ? sort : 'upvotes';
      const sortOrder = order === 'asc' ? 1 : -1;
      const sortQuery = { [sortField]: sortOrder };

      // Pagination
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.max(1, parseInt(limit));
      const skipNum = (pageNum - 1) * limitNum;

      // Execute in parallel
      const [posts, total] = await Promise.all([
        RedditPost.find(query)
          .sort(sortQuery)
          .skip(skipNum)
          .limit(limitNum)
          .lean(),
        RedditPost.countDocuments(query),
      ]);

      // Enrich posts with favorites status
      const favoriteIds = await Favorite.find({ itemType: 'RedditPost' }).distinct('itemId');
      const favoriteSet = new Set(favoriteIds.map(id => id.toString()));

      const enrichedPosts = posts.map(post => ({
        ...post,
        isFavorite: favoriteSet.has(post._id.toString()),
      }));

      res.status(200).json({
        success: true,
        count: enrichedPosts.length,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        data: enrichedPosts,
      });
    } catch (error) {
      logger.error(`[RedditController] Error fetching Reddit posts: ${error.message}`);
      next(error);
    }
  }

  /**
   * Toggles the favorite bookmark state of a Reddit post.
   * Route: POST /api/reddit/favorites
   */
  async toggleFavorite(req, res, next) {
    try {
      const { postId } = req.body;
      if (!postId) {
        return res.status(400).json({ success: false, error: 'postId is required.' });
      }

      // Verify post exists
      const post = await RedditPost.findById(postId);
      if (!post) {
        return res.status(404).json({ success: false, error: 'Reddit post not found.' });
      }

      const existingFav = await Favorite.findOne({ itemId: postId, itemType: 'RedditPost' });

      if (existingFav) {
        await Favorite.deleteOne({ _id: existingFav._id });
        return res.status(200).json({ success: true, bookmarked: false, message: 'Removed from bookmarks.' });
      } else {
        await Favorite.create({ itemId: postId, itemType: 'RedditPost' });
        return res.status(200).json({ success: true, bookmarked: true, message: 'Added to bookmarks.' });
      }
    } catch (error) {
      logger.error(`[RedditController] Error toggling favorite Reddit post: ${error.message}`);
      next(error);
    }
  }

  /**
   * Retrieves bookmarked Reddit posts.
   * Route: GET /api/reddit/favorites
   */
  async getFavorites(req, res, next) {
    try {
      const favorites = await Favorite.find({ itemType: 'RedditPost' }).populate({
        path: 'itemId',
        model: 'RedditPost'
      }).lean();

      // Filter out orphaned references if posts were updated or deleted
      const bookmarkedPosts = favorites
        .filter(fav => fav.itemId)
        .map(fav => ({
          ...fav.itemId,
          isFavorite: true,
        }));

      res.status(200).json({
        success: true,
        count: bookmarkedPosts.length,
        data: bookmarkedPosts,
      });
    } catch (error) {
      logger.error(`[RedditController] Error getting favorite Reddit posts: ${error.message}`);
      next(error);
    }
  }

  /**
   * Fetches the selftext and top comments for a Reddit post.
   * Route: GET /api/reddit/posts/:id/content
   */
  async getPostContent(req, res, next) {
    try {
      const { id } = req.params;
      const post = await RedditPost.findById(id);
      if (!post) {
        return res.status(404).json({ success: false, error: 'Reddit post not found.' });
      }

      logger.info(`[RedditController] Fetching raw JSON thread content for: ${post.title}`);

      const axios = require('axios');
      const headers = {
        'User-Agent': process.env.REDDIT_USER_AGENT || 'OSINT-Dashboard/1.0.0 (by Antigravity)',
      };

      try {
        const jsonUrl = `${post.postUrl}.json`;
        const response = await axios.get(jsonUrl, { headers });

        // Reddit returns an array of two components:
        // [0] contains the post metadata & selftext
        // [1] contains the comments tree
        const postDetail = response.data[0]?.data?.children[0]?.data || {};
        const commentsList = response.data[1]?.data?.children || [];

        const selftext = postDetail.selftext || 'No text content provided (this is a link or media post).';

        // Extract top 10 parent comments
        const cleanComments = commentsList
          .slice(0, 10)
          .map((c) => {
            const data = c.data;
            if (!data || c.kind === 'more') return null;
            return {
              author: data.author || 'anonymous',
              upvotes: data.upsubs || data.score || 0,
              body: data.body || '',
              createdAt: new Date(data.created_utc * 1000)
            };
          })
          .filter(Boolean);

        return res.status(200).json({
          success: true,
          selftext,
          comments: cleanComments,
          title: post.title,
          author: post.author,
          subreddit: post.subreddit,
          upvotes: post.upvotes
        });
      } catch (apiErr) {
        logger.error(`[RedditController] Failed to fetch thread content from Reddit JSON API: ${apiErr.message}`);
        return res.status(200).json({
          success: true,
          selftext: 'No text content could be fetched (thread may be restricted or deleted). Check the thread here: ' + post.postUrl,
          comments: []
        });
      }
    } catch (error) {
      logger.error(`[RedditController] Error in getPostContent: ${error.message}`);
      next(error);
    }
  }

  /**
   * Fetches hot posts from a subreddit or a global query live from Reddit.
   * Route: GET /api/reddit/subreddit/live
   */
  async getLiveRedditSubreddit(req, res, next) {
    try {
      const { name } = req.query;
      if (!name) {
        return res.status(400).json({ success: false, error: 'Subreddit name or search query is required.' });
      }

      logger.info(`[RedditController] Fetching live Reddit data for: ${name}`);

      const axios = require('axios');
      const headers = {
        'User-Agent': process.env.REDDIT_USER_AGENT || 'OSINT-Dashboard/1.0.0 (by Antigravity)',
      };

      let subreddit = name.trim();
      if (subreddit.toLowerCase().startsWith('r/')) {
        subreddit = subreddit.slice(2);
      }

      let fetchUrl = `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/hot.json?limit=15`;
      let isSubredditQuery = true;

      try {
        const response = await axios.get(fetchUrl, { headers });
        const posts = response.data?.data?.children || [];

        if (posts.length === 0) {
          isSubredditQuery = false;
        } else {
          const formattedPosts = posts.map(p => {
            const d = p.data;
            return {
              title: d.title,
              author: d.author,
              subreddit: d.subreddit,
              upvotes: d.ups || d.score || 0,
              comments: d.num_comments || 0,
              postUrl: `https://www.reddit.com${d.permalink}`,
              selftext: d.selftext || 'No text content provided.',
              createdAt: new Date(d.created_utc * 1000)
            };
          });

          // Save these posts to our DB so they are cached and bookmarked
          for (const postData of formattedPosts) {
            try {
              await RedditPost.findOneAndUpdate(
                { postUrl: postData.postUrl },
                postData,
                { upsert: true, new: true }
              );
            } catch (dbErr) {
              logger.error(`[RedditController] Failed to upsert live Reddit post: ${dbErr.message}`);
            }
          }

          const savedPosts = await Promise.all(
            formattedPosts.map(async (p) => {
              const doc = await RedditPost.findOne({ postUrl: p.postUrl }).lean();
              return { ...p, _id: doc._id };
            })
          );

          return res.status(200).json({
            success: true,
            type: 'subreddit',
            subreddit,
            data: savedPosts
          });
        }
      } catch (err) {
        logger.info(`[RedditController] Failed fetching r/${subreddit} directly, falling back to search query: ${err.message}`);
        isSubredditQuery = false;
      }

      if (!isSubredditQuery) {
        try {
          const searchUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(name)}&sort=relevance&limit=15`;
          const response = await axios.get(searchUrl, { headers });
          const posts = response.data?.data?.children || [];

          const formattedPosts = posts.map(p => {
            const d = p.data;
            return {
              title: d.title,
              author: d.author,
              subreddit: d.subreddit,
              upvotes: d.ups || d.score || 0,
              comments: d.num_comments || 0,
              postUrl: `https://www.reddit.com${d.permalink}`,
              selftext: d.selftext || 'No text content provided.',
              createdAt: new Date(d.created_utc * 1000)
            };
          });

          for (const postData of formattedPosts) {
            try {
              await RedditPost.findOneAndUpdate(
                { postUrl: postData.postUrl },
                postData,
                { upsert: true, new: true }
              );
            } catch (dbErr) {
              logger.error(`[RedditController] Failed to upsert live Reddit post from search: ${dbErr.message}`);
            }
          }

          const savedPosts = await Promise.all(
            formattedPosts.map(async (p) => {
              const doc = await RedditPost.findOne({ postUrl: p.postUrl }).lean();
              return { ...p, _id: doc._id };
            })
          );

          return res.status(200).json({
            success: true,
            type: 'search',
            query: name,
            data: savedPosts
          });
        } catch (searchErr) {
          logger.error(`[RedditController] Live search failed: ${searchErr.message}`);
          return res.status(500).json({ success: false, error: `Failed to search Reddit: ${searchErr.message}` });
        }
      }
    } catch (error) {
      logger.error(`[RedditController] Error in getLiveRedditSubreddit: ${error.message}`);
      next(error);
    }
  }
}

module.exports = new RedditController();
