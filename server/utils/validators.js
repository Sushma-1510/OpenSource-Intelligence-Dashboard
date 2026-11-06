/**
 * Data-quality checks applied to every record before it is written to MongoDB.
 *
 * External APIs occasionally return incomplete or malformed items (deleted
 * Reddit authors, repos with missing owners, bad timestamps). Instead of
 * letting those fail silently or crash a whole batch, each record is
 * validated; bad ones are skipped and counted in the sync log.
 */

const isValidDate = (d) => d instanceof Date && !Number.isNaN(d.getTime());
const isNonNegativeNumber = (n) => typeof n === 'number' && Number.isFinite(n) && n >= 0;
const isNonEmptyString = (s) => typeof s === 'string' && s.trim().length > 0;
const isHttpUrl = (s) => typeof s === 'string' && /^https?:\/\//.test(s);

/** @returns {string[]} list of problems; empty means valid */
const validateRepository = (r) => {
  const errors = [];
  if (!isNonEmptyString(r.fullName)) errors.push('missing fullName');
  if (!isNonEmptyString(r.name)) errors.push('missing name');
  if (!isNonEmptyString(r.owner)) errors.push('missing owner');
  if (!isHttpUrl(r.repoUrl)) errors.push('invalid repoUrl');
  if (!isNonNegativeNumber(r.stars)) errors.push('invalid stars');
  if (!isNonNegativeNumber(r.forks)) errors.push('invalid forks');
  if (!isValidDate(r.createdAt)) errors.push('invalid createdAt');
  if (!isValidDate(r.updatedAt)) errors.push('invalid updatedAt');
  return errors;
};

const validateRedditPost = (p) => {
  const errors = [];
  if (!isNonEmptyString(p.title)) errors.push('missing title');
  if (!isNonEmptyString(p.subreddit)) errors.push('missing subreddit');
  if (!isHttpUrl(p.postUrl)) errors.push('invalid postUrl');
  if (typeof p.upvotes !== 'number' || !Number.isFinite(p.upvotes)) errors.push('invalid upvotes');
  if (!isNonNegativeNumber(p.comments)) errors.push('invalid comments');
  if (!isValidDate(p.createdAt)) errors.push('invalid createdAt');
  return errors;
};

module.exports = { validateRepository, validateRedditPost };
