/**
 * Shared, safe builders for MongoDB filter objects from request query params.
 *
 * Before this, the same filter code was copy-pasted in four controllers and
 * user input went straight into `$regex`. That allows regex injection
 * (e.g. `search=(a+)+$` can hang the database) and odd matches on characters
 * like `.` or `*`. Everything user-supplied is now escaped and type-checked.
 */

const MAX_SEARCH_LENGTH = 100;
const MAX_PAGE_SIZE = 100;

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Express can turn `?search[$ne]=x` into an object; only accept plain strings.
const asString = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, MAX_SEARCH_LENGTH);
};

const asNonNegativeInt = (value) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

const containsRegex = (text) => new RegExp(escapeRegex(text), 'i');

const buildRepoQuery = ({ search, language, minStars, maxStars, minForks } = {}) => {
  const query = {};
  const s = asString(search);
  if (s) {
    const rx = containsRegex(s);
    query.$or = [{ name: rx }, { fullName: rx }, { description: rx }];
  }

  const lang = asString(language);
  if (lang) query.language = new RegExp(`^${escapeRegex(lang)}$`, 'i');

  const min = asNonNegativeInt(minStars);
  const max = asNonNegativeInt(maxStars);
  if (min !== undefined || max !== undefined) {
    query.stars = {};
    if (min !== undefined) query.stars.$gte = min;
    if (max !== undefined) query.stars.$lte = max;
  }

  const forks = asNonNegativeInt(minForks);
  if (forks !== undefined) query.forks = { $gte: forks };

  return query;
};

const buildRedditQuery = ({ search, subreddit } = {}) => {
  const query = {};
  const s = asString(search);
  if (s) {
    const rx = containsRegex(s);
    query.$or = [{ title: rx }, { author: rx }];
  }
  const sub = asString(subreddit).toLowerCase();
  if (sub) query.subreddit = sub;
  return query;
};

const parsePagination = ({ page, limit } = {}, defaultLimit = 10) => {
  const pageNum = Math.max(1, asNonNegativeInt(page) || 1);
  const limitNum = Math.min(MAX_PAGE_SIZE, Math.max(1, asNonNegativeInt(limit) || defaultLimit));
  return { pageNum, limitNum, skipNum: (pageNum - 1) * limitNum };
};

module.exports = {
  escapeRegex,
  buildRepoQuery,
  buildRedditQuery,
  parsePagination,
  MAX_PAGE_SIZE,
};
