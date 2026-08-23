const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(new URL('../youtube-premium-like.js', `file://${__dirname}/`), 'utf8');

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
  JSON.stringify({ adSlots: [{ adSlotRenderer: {} }], contents: [{ videoRenderer: { videoId: 'ok' } }] })
);
const apiBody = JSON.parse(api.body);
assert.equal('adSlots' in apiBody, false);
assert.equal(apiBody.contents[0].videoRenderer.videoId, 'ok');

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
assert.match(page.body, /surge-premium-like-js/);
assert.match(page.body, /var ytInitialData = \{"ok":true\};/);
assert.equal(page.headers['Content-Security-Policy'], undefined);
assert.equal(page.headers['Content-Security-Policy-Report-Only'], undefined);
assert.equal(page.headers['Content-Length'], undefined);
assert.equal(page.headers['Content-Type'], 'text/html; charset=utf-8');

console.log('web response tests passed');
