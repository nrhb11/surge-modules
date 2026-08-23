const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(new URL('../youtube-music-request.js', `file://${__dirname}/`), 'utf8');
let result;
vm.runInNewContext(source, {
  $request: { headers: { 'user-agent': 'Safari/27.0', Cookie: 'unchanged' } },
  $done(value) { result = value; }
});

assert.match(result.headers['User-Agent'], /Chrome\/140\.0\.0\.0/);
assert.equal(result.headers.Cookie, 'unchanged');
assert.equal('user-agent' in result.headers, false);
console.log('music request compatibility tests passed');
