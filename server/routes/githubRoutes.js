const express = require('express');
const githubController = require('../controllers/githubController');

const router = express.Router();

// Define GitHub integration routes
router.get('/repository/live', githubController.getLiveRepository.bind(githubController));
router.get('/repositories', githubController.getRepositories.bind(githubController));
router.get('/trending', githubController.getTrending.bind(githubController));
router.get('/export', githubController.exportRepositories.bind(githubController));
router.post('/favorites', githubController.toggleFavorite.bind(githubController));
router.get('/favorites', githubController.getFavorites.bind(githubController));
router.get('/repositories/:id/readme', githubController.getReadme.bind(githubController));

module.exports = router;
