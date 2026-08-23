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
assert.equal(moduleText.includes('googlevideo.com'), true);
assert.equal(moduleText.includes('/ptracking'), false);
assert.equal(moduleText.includes('/api\\/stats\\/ads'), false);
assert.equal(moduleText.includes('#!arguments=captionLang:zh-Hans'), false);
assert.equal(moduleText.includes('\\"captionLang\\":\\"off\\"'), true);
const mobileRule = moduleText.split('\n').find((line) => line.startsWith('youtube.mobile.response ='));
assert.equal(mobileRule.includes('|player|'), true);
assert.equal(mobileRule.includes('|get_watch|'), true);
assert.equal(mobileRule.includes('youtube-mobile-response.js?v=20260824.4'), true);

const ctier = /(^https?:\/\/[\w-]+\.googlevideo\.com\/(?!dclk_video_ads).+?)&ctier=L(&.+?),ctier,(.+)/;
const playback = 'https://rr1---sn-test.googlevideo.com/initplayback?id=1&ctier=L&foo=2,ctier,tail';
const rewritten = playback.replace(ctier, '$1$2$3');
assert.equal(rewritten.includes('ctier'), false);
assert.equal(rewritten, 'https://rr1---sn-test.googlevideo.com/initplayback?id=1&foo=2tail');

const oad = /^https?:\/\/[\w-]+\.googlevideo\.com\/(?!(dclk_video_ads|videoplayback(?:\?|\/))).+&oad/;
assert.equal(oad.test('https://rr1---sn-test.googlevideo.com/initplayback?id=1&oad=1'), true);
assert.equal(oad.test('https://rr1---sn-test.googlevideo.com/videoplayback?id=1&oad=1'), false);
assert.equal(oad.test('https://rr1---sn-test.googlevideo.com/dclk_video_ads?id=1&oad=1'), false);

console.log('module fallback rule tests passed');
