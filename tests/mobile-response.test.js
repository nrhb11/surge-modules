const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync(new URL('../vendor/youtube-mobile-response.js', `file://${__dirname}/`), 'utf8');

// Player/get_watch remove ads and retain PiP/background capabilities, but do
// not call the caption-track mutator. Captions remain entirely YouTube-native.
assert.equal(source.includes('function Br(l,e){Ni(l),Si(l)}'), true);
assert.equal(source.includes('function Br(l,e){Ni(l)}'), false);
assert.equal(source.includes('function Br(l,e){Ni(l),Si(l),Pi(l,e)}'), false);

console.log('mobile response isolation tests passed');
