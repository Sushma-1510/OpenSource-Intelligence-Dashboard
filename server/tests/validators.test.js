const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateRepository, validateRedditPost } = require('../utils/validators');
const { mapRepository } = require('../services/githubService');
const { mapRedditPost } = require('../services/redditService');

const githubItem = {
  name: 'react',
  full_name: 'facebook/react',
  description: 'UI library',
  stargazers_count: 230000,
  forks_count: 47000,
  watchers_count: 230000,
  open_issues_count: 800,
  license: { spdx_id: 'MIT' },
  language: 'JavaScript',
  topics: ['ui'],
  owner: { login: 'facebook', avatar_url: 'https://x/y.png' },
  html_url: 'https://github.com/facebook/react',
  created_at: '2013-05-24T16:15:54Z',
  updated_at: '2026-10-30T10:00:00Z',
};

test('a well-formed GitHub item maps to a valid record', () => {
  const r = mapRepository(githubItem, Date.UTC(2026, 10, 1));
  assert.deepEqual(validateRepository(r), []);
  assert.equal(r.fullName, 'facebook/react');
  assert.equal(r.license, 'MIT');
  assert.ok(r.trendingScore > 0 && r.trendingScore <= 100);
});

test('a GitHub item with missing owner and bad date is rejected', () => {
  const r = mapRepository({ ...githubItem, owner: null, updated_at: 'nope' });
  const errors = validateRepository(r);
  assert.ok(errors.includes('missing owner'));
  assert.ok(errors.includes('invalid updatedAt'));
});

const redditData = {
  title: 'Show HN-style post',
  author: 'someone',
  score: 120,
  num_comments: 14,
  permalink: '/r/opensource/comments/abc/post/',
  thumbnail: 'self',
  created_utc: 1761900000,
};

test('a well-formed Reddit post maps to a valid record', () => {
  const p = mapRedditPost(redditData, 'OpenSource');
  assert.deepEqual(validateRedditPost(p), []);
  assert.equal(p.subreddit, 'opensource');
  assert.equal(p.upvotes, 120, 'upvotes should come from data.score');
  assert.equal(p.thumbnail, '', 'non-URL thumbnails are dropped');
});

test('a Reddit post with no permalink or title is rejected', () => {
  const p = mapRedditPost({ ...redditData, title: '', permalink: undefined }, 'webdev');
  const errors = validateRedditPost(p);
  assert.ok(errors.includes('missing title'));
  assert.ok(errors.includes('invalid postUrl'));
});

test('deleted authors are kept as [deleted] rather than failing', () => {
  const p = mapRedditPost({ ...redditData, author: undefined }, 'webdev');
  assert.equal(p.author, '[deleted]');
  assert.deepEqual(validateRedditPost(p), []);
});
