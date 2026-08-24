const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(new URL('../modules/streaming/youtube/scripts/youtube-home-response.js', `file://${__dirname}/`), 'utf8');

function run(body, headers = {}) {
  let result;
  vm.runInNewContext(source, {
    $argument: '{"hideShorts":false,"debug":false}',
    $response: { body, headers },
    $done(value) { result = value; },
    console
  });
  return result;
}

const html = '<html><head></head><body><script nonce="keep">var ytInitialData = {"contents":[{"richItemRenderer":{"content":{"adSlotRenderer":{"slot":1}},"trackingParams":"ad-shell"}},{"richItemRenderer":{"content":{"videoRenderer":{"videoId":"ok"}}}}],"text":"brace } and \\\"quote\\\""};</script></body></html>';
const result = run(html, {
  'Content-Security-Policy': "script-src 'nonce-keep'",
  'Content-Security-Policy-Report-Only': 'default-src self',
  'Content-Encoding': 'br',
  'Content-Length': '999',
  'Content-Type': 'text/html; charset=utf-8'
});

assert.equal(result.body.includes('adSlotRenderer'), false);
assert.equal(result.body.includes('"videoId":"ok"'), true);
assert.equal(result.body.includes('ad-shell'), false);
assert.equal(result.body.includes('nonce="keep"'), true);
assert.equal(result.headers['Content-Security-Policy'], "script-src 'nonce-keep'");
assert.equal(result.headers['Content-Security-Policy-Report-Only'], 'default-src self');
assert.equal('Content-Encoding' in result.headers, false);
assert.equal('Content-Length' in result.headers, false);

const untouched = run('<html><body>native</body></html>', { 'Content-Length': '32' });
assert.deepEqual(Object.keys(untouched), []);

console.log('homepage response tests passed');
