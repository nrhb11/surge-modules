const assert = require('node:assert/strict');
const fs = require('node:fs');

const moduleText = fs.readFileSync(new URL('../YouTube-Premium-Like.sgmodule', `file://${__dirname}/`), 'utf8');
assert.equal(moduleText.includes('youtube.music.page ='), false);
assert.equal(moduleText.includes('youtube.music.api ='), true);
assert.equal(moduleText.includes('youtube.web.home ='), false);
assert.equal(moduleText.includes('youtube.web.home-data = type=http-response'), true);
assert.equal(moduleText.includes('youtube-home-response.js?v=20260823.2'), true);
assert.equal(moduleText.includes('youtube.web.watch ='), false);
assert.equal(moduleText.includes('youtube.web.results ='), false);
assert.equal(moduleText.includes('youtube.web.shorts ='), false);
assert.equal(moduleText.includes('youtube.web.compat = type=http-request'), true);
assert.equal(moduleText.includes('youtube-web-request.js?v=20260823.1'), true);
assert.equal(moduleText.includes('youtube.music.compat = type=http-request'), false);
assert.equal(moduleText.includes('youtube-music-request.js'), false);
assert.equal(moduleText.includes('youtube-premium-like.js?v=20260823.9'), true);
assert.equal(moduleText.includes('(browse|next|search|player|guide|get_watch)'), false);
assert.equal(moduleText.includes('googlevideo.com'), false);
assert.equal(moduleText.includes('/ptracking'), false);
assert.equal(moduleText.includes('/api\\/stats\\/ads'), false);

console.log('module fallback rule tests passed');
