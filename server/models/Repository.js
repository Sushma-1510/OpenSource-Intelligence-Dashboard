const mongoose = require('mongoose');

const repositorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    stars: {
      type: Number,
      required: true,
      index: -1,
    },
    forks: {
      type: Number,
      required: true,
      index: -1,
    },
    issues: {
      type: Number,
      required: true,
      default: 0,
    },
    watchers: {
      type: Number,
      required: true,
      default: 0,
    },
    license: {
      type: String,
      default: 'None',
    },
    language: {
      type: String,
      default: 'Unknown',
      index: true,
    },
    topics: {
      type: [String],
      default: [],
    },
    owner: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    repoUrl: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      required: true,
    },
    updatedAt: {
      type: Date,
      required: true,
      index: -1,
    },
    trendingScore: {
      type: Number,
      required: true,
      default: 0,
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

// Compounding search index for name and language to allow fast dashboard searching, overriding the default language field parsing
repositorySchema.index(
  { name: 'text', description: 'text', language: 'text' },
  { language_override: 'none' }
);

const Repository = mongoose.model('Repository', repositorySchema);

module.exports = Repository;
