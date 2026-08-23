/* Keep YouTube Music usable when Google rejects a new Safari version. */
const headers = Object.assign({}, $request.headers || {});
const chromeUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

for (const key of Object.keys(headers)) {
  if (key.toLowerCase() === 'user-agent') delete headers[key];
}
headers['User-Agent'] = chromeUA;

$done({ headers });
