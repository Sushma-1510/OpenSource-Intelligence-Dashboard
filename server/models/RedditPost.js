const mongoose = require('mongoose');

const redditPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    subreddit: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    upvotes: {
      type: Number,
      required: true,
      default: 0,
      index: -1,
    },
    comments: {
      type: Number,
      required: true,
      default: 0,
    },
    postUrl: {
      type: String,
      required: true,
      unique: true,
    },
    thumbnail: {
      type: String,
      default: '',
    },
    createdAt: {
      type: Date,
      required: true,
      index: -1,
    },
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    }
  },
  {
    timestamps: true,
  }
);

// Compounding search index for text search on title
redditPostSchema.index({ title: 'text' });

const RedditPost = mongoose.model('RedditPost', redditPostSchema);

module.exports = RedditPost;
