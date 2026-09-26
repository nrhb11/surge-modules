const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../modules/streaming/bilibili-web/scripts/bilibili-web-response.js'), 'utf8');

function run(url, contentType, body, argument = '{}', status = 200) {
  let result;
  vm.runInNewContext(source, {
    $request: { url },
    $response: { status, headers: { 'Content-Type': contentType }, body },
    $argument: argument,
    $done(value) { result = value; },
  });
  assert.ok(result, '$done must be called');
  return result;
}

const home = 'https://www.bilibili.com/';
const markup = '<!doctype html><html><head><title>Bilibili</title></head><body>视频</body></html>';
const homeResult = run(home, 'text/html; charset=utf-8', markup);
assert.match(homeResult.body, /data-surge-bilibili-web-adblock/);
assert.match(homeResult.body, /\.feed-card:has\(a\[href\*="cm\.bilibili\.com\/cm\/api\/"\]\)/);
assert.match(homeResult.body, /\.carousel-container \.extension-tips-v2/);
assert.match(homeResult.body, /\.floor-single-card:has\(a\[href\*="live\.bilibili\.com\/"\]\)/);
assert.ok(!run(home, 'text/html', markup, '{"hideHomeLive":false}').body.includes('.floor-single-card:has(a[href*="live.bilibili.com/"])'));
assert.ok(!homeResult.body.includes('.recommended-container_floor-aside .recommended-swipe'));
assert.match(run(home, 'text/html', markup, '{"hideCarousel":true}').body, /recommended-swipe/);
assert.equal(Object.keys(run(home, 'application/json', '{}')).length, 0);
assert.equal(Object.keys(run(home, 'text/html', markup, '{}', 304)).length, 0);
assert.equal(Object.keys(run(home, 'text/html', homeResult.body)).length, 0);

const feedUrl = 'https://api.bilibili.com/x/web-interface/wbi/index/top/feed/rcmd?ps=8';
const items = [
  { goto: 'av', uri: 'https://www.bilibili.com/video/BV1abc' },
  { goto: 'ad', uri: 'https://www.bilibili.com/video/BV2abc' },
  { goto: 'av', is_ad: 1 },
  { goto: 'av', uri: 'https://cm.bilibili.com/cm/api/fees/pc/sync/v2' },
];
const feedResult = run(feedUrl, 'application/json', JSON.stringify({ code: 0, data: { item: items } }));
assert.equal(JSON.parse(feedResult.body).data.item.length, 1);
assert.equal(JSON.parse(feedResult.body).data.item[0].uri, items[0].uri);
assert.equal(Object.keys(run(feedUrl, 'application/json', '{broken')).length, 0);

console.log('Bilibili web response tests passed');
