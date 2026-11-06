/**
 * Trending score (0-100).
 *
 * The old formula was `stars*0.5 + forks*0.2 + watchers*0.2 + activity*0.1`.
 * Two problems with it:
 *   1. Raw stars are in the thousands while activity maxed out at 10 points,
 *      so the ranking was effectively just "sort by stars".
 *   2. In the GitHub Search API `watchers_count` is the same number as
 *      `stargazers_count`, so stars were counted twice.
 *
 * This version puts every signal on a 0-1 scale before weighting:
 *   - stars and forks use log10, because popularity is heavy-tailed
 *     (going from 1k -> 10k stars matters as much as 10k -> 100k)
 *   - recency decays smoothly with a 30-day half-life instead of fixed buckets
 */

const WEIGHTS = { stars: 0.45, forks: 0.2, recency: 0.35 };

// Reference ceilings: values at or above these count as 1.0
const STAR_CEILING = 500000;
const FORK_CEILING = 100000;
const RECENCY_HALF_LIFE_DAYS = 30;

const clamp01 = (x) => Math.min(1, Math.max(0, x));

const logNormalize = (value, ceiling) => {
  const v = Number(value) || 0;
  if (v <= 0) return 0;
  return clamp01(Math.log10(v + 1) / Math.log10(ceiling + 1));
};

const recencyFactor = (updatedAt, now = Date.now()) => {
  const t = new Date(updatedAt).getTime();
  if (Number.isNaN(t)) return 0;
  const days = Math.max(0, (now - t) / 86400000);
  return Math.pow(0.5, days / RECENCY_HALF_LIFE_DAYS);
};

/**
 * @param {{stars:number, forks:number, updatedAt:string|Date}} repo
 * @param {number} [now] - injectable clock for tests
 * @returns {number} score between 0 and 100, rounded to 2 decimals
 */
const calculateTrendingScore = ({ stars, forks, updatedAt }, now = Date.now()) => {
  const score =
    WEIGHTS.stars * logNormalize(stars, STAR_CEILING) +
    WEIGHTS.forks * logNormalize(forks, FORK_CEILING) +
    WEIGHTS.recency * recencyFactor(updatedAt, now);
  return Math.round(score * 10000) / 100;
};

module.exports = { calculateTrendingScore, logNormalize, recencyFactor, WEIGHTS };
