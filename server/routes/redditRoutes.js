const express = require('express');
const redditController = require('../controllers/redditController');

const router = express.Router();

// Define Reddit integration routes
router.get('/subreddit/live', redditController.getLiveRedditSubreddit.bind(redditController));
router.get('/posts', redditController.getPosts.bind(redditController));
router.post('/favorites', redditController.toggleFavorite.bind(redditController));
router.get('/favorites', redditController.getFavorites.bind(redditController));
router.get('/posts/:id/content', redditController.getPostContent.bind(redditController));

module.exports = router;
