const mongoose = require('mongoose');

/**
 * Daily time-series snapshot of a repository's metrics.
 *
 * The Repository collection only holds the latest values, so there was no way
 * to answer "how fast is this repo growing?". Each sync writes at most one
 * snapshot per repo per UTC day (upsert on fullName + day), which gives a
 * clean daily series for growth charts.
 */
const repoSnapshotSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    day: { type: Date, required: true }, // midnight UTC of the snapshot day
    stars: { type: Number, required: true, min: 0 },
    forks: { type: Number, required: true, min: 0 },
    issues: { type: Number, default: 0, min: 0 },
    trendingScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

repoSnapshotSchema.index({ fullName: 1, day: 1 }, { unique: true });
// Retention: snapshots older than ~1 year are removed automatically by MongoDB.
repoSnapshotSchema.index({ createdAt: 1 }, { expireAfterSeconds: 366 * 24 * 60 * 60 });

const startOfUtcDay = (date = new Date()) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const RepoSnapshot = mongoose.model('RepoSnapshot', repoSnapshotSchema);

module.exports = RepoSnapshot;
module.exports.startOfUtcDay = startOfUtcDay;
