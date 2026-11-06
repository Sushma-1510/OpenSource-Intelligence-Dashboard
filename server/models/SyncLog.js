const mongoose = require('mongoose');

/**
 * Audit trail of every ingestion run: where the data came from, how many
 * records were fetched / written / rejected, how long it took and whether it
 * failed. Useful for debugging and for showing data freshness in the UI.
 */
const syncLogSchema = new mongoose.Schema(
  {
    source: { type: String, enum: ['github', 'reddit'], required: true, index: true },
    status: { type: String, enum: ['success', 'partial', 'failed'], required: true },
    startedAt: { type: Date, required: true },
    finishedAt: { type: Date, required: true },
    durationMs: { type: Number, required: true },
    fetched: { type: Number, default: 0 },
    upserted: { type: Number, default: 0 },
    rejected: { type: Number, default: 0 },
    purged: { type: Number, default: 0 },
    rejectionSamples: { type: [String], default: [] }, // first few validation errors
    error: { type: String, default: '' },
  },
  { timestamps: true }
);

// Keep 90 days of sync history (this index also serves "latest first" sorts).
syncLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('SyncLog', syncLogSchema);
