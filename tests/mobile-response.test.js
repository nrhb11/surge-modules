const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync(new URL('../modules/streaming/youtube/vendor/youtube-mobile-response.js', `file://${__dirname}/`), 'utf8');

// The vendored mobile processor is byte-for-byte the reference implementation.
assert.equal(source.includes('function Br(l,e){Ni(l),Si(l),Pi(l,e)}'), true);

console.log('mobile response isolation tests passed');
