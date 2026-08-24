const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(new URL('../modules/streaming/youtube/scripts/youtube-web-request.js', `file://${__dirname}/`), 'utf8');

function run(headers) {
  let result;
  vm.runInNewContext(source, {
    $request: { headers },
    $done(value) { result = value || {}; }
  });
  return result;
}

const repaired = run({ origin: 'null', Cookie: 'unchanged' });
assert.equal(repaired.headers.Origin, 'https://www.youtube.com');
assert.equal(repaired.headers.Cookie, 'unchanged');
assert.equal('origin' in repaired.headers, false);

const native = run({ Origin: 'https://www.youtube.com' });
assert.deepEqual(Object.keys(native), []);
console.log('youtube web request compatibility tests passed');
