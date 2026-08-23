const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(new URL('../youtube-premium-like.js', `file://${__dirname}/`), 'utf8');
assert.equal(source.includes('window.fetch ='), false);
assert.equal(source.includes("trap('ytInitialData')"), false);
assert.equal(source.includes('ytd-popup-container:has(a[href="/premium"])'), false);
assert.equal(source.includes('surge-premium'), false);
assert.equal(source.includes('<style'), false);
assert.equal(source.includes('<script'), false);

function run(url, body, headers = {}) {
  let result;
  const context = {
    $argument: '{"hideShorts":false,"debug":false}',
    $request: { url },
    $response: { body, headers },
    $done(value) { result = value; },
    console
  };
  vm.runInNewContext(source, context);
  return result;
}

const api = run(
  'https://www.youtube.com/youtubei/v1/browse',
  JSON.stringify({
    adSlots: [{ adSlotRenderer: {} }],
    contents: [
      { richItemRenderer: { content: { adSlotRenderer: {} }, trackingParams: 'ad-shell' } },
      { richItemRenderer: { content: { videoRenderer: { videoId: 'ok' } } } }
    ]
  })
);
const apiBody = JSON.parse(api.body);
assert.equal('adSlots' in apiBody, false);
assert.equal(apiBody.contents.length, 1);
assert.equal(apiBody.contents[0].richItemRenderer.content.videoRenderer.videoId, 'ok');

const musicApi = run(
  'https://music.youtube.com/youtubei/v1/player',
  JSON.stringify({
    playerAds: [{ inStreamVideoAdRenderer: {} }],
    overlay: { musicPremiumUpsellRenderer: {} },
    videoDetails: { videoId: 'music-ok' }
  })
);
const musicApiBody = JSON.parse(musicApi.body);
assert.equal('playerAds' in musicApiBody, false);
assert.equal('musicPremiumUpsellRenderer' in musicApiBody.overlay, false);
assert.equal(musicApiBody.videoDetails.videoId, 'music-ok');

const page = run(
  'https://www.youtube.com/',
  '<html><head></head><body><script>var ytInitialData = {"adSlots":[{"adSlotRenderer":{}}],"ok":true};</script></body></html>',
  {
    'Content-Security-Policy': "script-src 'nonce-test'",
    'Content-Security-Policy-Report-Only': 'default-src self',
    'Content-Length': '123',
    'Content-Type': 'text/html; charset=utf-8'
  }
);
assert.deepEqual(Object.keys(page), []);

const musicPage = run(
  'https://music.youtube.com/',
  '<html><head></head><body><script>var ytInitialData = {"adPlacements":[{}],"music":true};</script></body></html>',
  { 'Content-Type': 'text/html; charset=utf-8' }
);
assert.deepEqual(Object.keys(musicPage), []);

const musicScript = run(
  'https://music.youtube.com/s/desktop/app.js',
  'window.musicApplication = true;',
  { 'Content-Type': 'application/javascript; charset=utf-8' }
);
assert.equal(Object.keys(musicScript).length, 0);

const musicStyle = run(
  'https://music.youtube.com/s/desktop/app.css',
  'html,body{background:#000}',
  { 'Content-Type': 'text/css' }
);
assert.equal(Object.keys(musicStyle).length, 0);

console.log('web response tests passed');
