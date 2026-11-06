const { test } = require('node:test');
const assert = require('node:assert/strict');
const { calculateTrendingScore, logNormalize, recencyFactor } = require('../utils/trendingScore');

const NOW = Date.UTC(2026, 10, 1);
const daysAgo = (d) => new Date(NOW - d * 86400000).toISOString();

test('score is always between 0 and 100', () => {
  const cases = [
    { stars: 0, forks: 0, updatedAt: daysAgo(1000) },
    { stars: 10_000_000, forks: 10_000_000, updatedAt: daysAgo(0) },
    { stars: 5000, forks: 300, updatedAt: daysAgo(3) },
    { stars: undefined, forks: null, updatedAt: 'not a date' },
  ];
  for (const c of cases) {
    const s = calculateTrendingScore(c, NOW);
    assert.ok(s >= 0 && s <= 100, `score ${s} out of range`);
  }
});

test('recent activity can outrank a bigger but abandoned repo', () => {
  // This was impossible with the old formula (stars*0.5 dominated everything)
  const activeSmall = calculateTrendingScore({ stars: 20_000, forks: 2_000, updatedAt: daysAgo(0) }, NOW);
  const staleBig = calculateTrendingScore({ stars: 60_000, forks: 6_000, updatedAt: daysAgo(400) }, NOW);
  assert.ok(activeSmall > staleBig, `${activeSmall} should beat ${staleBig}`);
});

test('more stars means higher score when everything else is equal', () => {
  const a = calculateTrendingScore({ stars: 2_000, forks: 100, updatedAt: daysAgo(5) }, NOW);
  const b = calculateTrendingScore({ stars: 200_000, forks: 100, updatedAt: daysAgo(5) }, NOW);
  assert.ok(b > a);
});

test('recency halves every 30 days', () => {
  assert.equal(recencyFactor(daysAgo(0), NOW), 1);
  assert.ok(Math.abs(recencyFactor(daysAgo(30), NOW) - 0.5) < 1e-9);
  assert.ok(Math.abs(recencyFactor(daysAgo(60), NOW) - 0.25) < 1e-9);
  assert.equal(recencyFactor('garbage', NOW), 0);
});

test('logNormalize clamps to [0, 1]', () => {
  assert.equal(logNormalize(0, 1000), 0);
  assert.equal(logNormalize(-5, 1000), 0);
  assert.equal(logNormalize(1000, 1000), 1);
  assert.equal(logNormalize(1e9, 1000), 1);
});
