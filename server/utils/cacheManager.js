const mongoose = require('mongoose');

// Mini schema inside utility to track sync timestamps
const cacheStateSchema = new mongoose.Schema({
  provider: {
    type: String,
    required: true,
    unique: true, // 'github' or 'reddit'
  },
  lastSyncedAt: {
    type: Date,
    required: true,
    default: Date.now,
  }
});

const CacheState = mongoose.model('CacheState', cacheStateSchema);

const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 Hour in milliseconds

/**
 * Checks if the cache for a given provider is expired or empty.
 * @param {string} provider - 'github' or 'reddit'
 * @returns {Promise<boolean>} True if cache is expired or doesn't exist, false otherwise.
 */
const isCacheExpired = async (provider) => {
  try {
    const state = await CacheState.findOne({ provider });
    if (!state) {
      return true; // No record means cache is expired/empty
    }

    const elapsed = Date.now() - new Date(state.lastSyncedAt).getTime();
    return elapsed >= CACHE_DURATION_MS;
  } catch (error) {
    console.error(`[CacheManager] Error checking cache expiration for ${provider}:`, error.message);
    return true; // Fallback to fetching fresh data on error
  }
};

/**
 * Updates the sync timestamp for a given provider.
 * @param {string} provider - 'github' or 'reddit'
 */
const updateSyncTimestamp = async (provider) => {
  try {
    await CacheState.findOneAndUpdate(
      { provider },
      { lastSyncedAt: new Date() },
      { upsert: true, new: true }
    );
    console.log(`[CacheManager] Synced timestamp updated for: ${provider}`);
  } catch (error) {
    console.error(`[CacheManager] Error updating sync timestamp for ${provider}:`, error.message);
  }
};

/**
 * Retrieves the last sync date for a provider.
 * @param {string} provider - 'github' or 'reddit'
 * @returns {Promise<Date|null>} The timestamp or null.
 */
const getLastSyncedAt = async (provider) => {
  try {
    const state = await CacheState.findOne({ provider });
    return state ? state.lastSyncedAt : null;
  } catch (error) {
    return null;
  }
};

module.exports = {
  isCacheExpired,
  updateSyncTimestamp,
  getLastSyncedAt
};
