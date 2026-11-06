const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  escapeRegex,
  buildRepoQuery,
  buildRedditQuery,
  parsePagination,
} = require('../utils/queryFilters');

test('escapeRegex neutralises special characters', () => {
  const rx = new RegExp(escapeRegex('(a+)+$'));
  assert.ok(rx.test('(a+)+$'));
  assert.ok(!rx.test('aaaa'));
  assert.ok(new RegExp(escapeRegex('c++')).test('c++ tools'));
});

test('buildRepoQuery escapes search text', () => {
  const q = buildRepoQuery({ search: 'node.js' });
  const rx = q.$or[0].name;
  assert.ok(rx.test('Node.js'));
  assert.ok(!rx.test('nodexjs'), 'dot must be literal, not "any char"');
});

test('buildRepoQuery language is an exact, case-insensitive match', () => {
  const q = buildRepoQuery({ language: 'C++' });
  assert.ok(q.language.test('c++'));
  assert.ok(!q.language.test('C++/CLI'));
});

test('buildRepoQuery ignores non-string (operator injection) input', () => {
  const q = buildRepoQuery({ search: { $ne: '' }, language: ['x'] });
  assert.deepEqual(q, {});
});

test('buildRepoQuery parses numeric ranges and drops bad numbers', () => {
  assert.deepEqual(buildRepoQuery({ minStars: '1000', maxStars: '5000', minForks: '10' }), {
    stars: { $gte: 1000, $lte: 5000 },
    forks: { $gte: 10 },
  });
  assert.deepEqual(buildRepoQuery({ minStars: 'abc', minForks: '-3' }), {});
});

test('buildRedditQuery lowercases subreddit and escapes search', () => {
  const q = buildRedditQuery({ search: '[help]', subreddit: '  ReactJS ' });
  assert.equal(q.subreddit, 'reactjs');
  assert.ok(q.$or[0].title.test('Need [help] please'));
  assert.ok(!q.$or[0].title.test('h'));
});

test('parsePagination clamps page and limit', () => {
  assert.deepEqual(parsePagination({}), { pageNum: 1, limitNum: 10, skipNum: 0 });
  assert.deepEqual(parsePagination({ page: '3', limit: '20' }), { pageNum: 3, limitNum: 20, skipNum: 40 });
  assert.equal(parsePagination({ limit: '100000' }).limitNum, 100);
  assert.equal(parsePagination({ page: 'NaN', limit: '-1' }).pageNum, 1);
});
