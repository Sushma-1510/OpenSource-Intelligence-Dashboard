const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'itemType',
      index: true,
    },
    itemType: {
      type: String,
      required: true,
      enum: ['Repository', 'RedditPost'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user cannot duplicate a favorite item
favoriteSchema.index({ itemId: 1, itemType: 1 }, { unique: true });

const Favorite = mongoose.model('Favorite', favoriteSchema);

module.exports = Favorite;
