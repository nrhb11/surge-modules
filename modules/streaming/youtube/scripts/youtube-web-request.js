/* Repair Safari requests made from a previously modified opaque page. */
const headers = Object.assign({}, $request.headers || {});
let originKey = null;

for (const key of Object.keys(headers)) {
  if (key.toLowerCase() === 'origin') {
    originKey = key;
    break;
  }
}

if (!originKey || String(headers[originKey]).toLowerCase() === 'null') {
  if (originKey) delete headers[originKey];
  headers.Origin = 'https://www.youtube.com';
  $done({ headers });
} else {
  $done({});
}
