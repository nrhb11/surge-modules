/* Keep YouTube Music usable when Google rejects a new Safari version. */
const headers = Object.assign({}, $request.headers || {});
const chromeUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const replacements = {
  'user-agent': ['User-Agent', chromeUA],
  'sec-ch-ua': ['Sec-CH-UA', '"Chromium";v="140", "Google Chrome";v="140", "Not=A?Brand";v="24"'],
  'sec-ch-ua-mobile': ['Sec-CH-UA-Mobile', '?0'],
  'sec-ch-ua-platform': ['Sec-CH-UA-Platform', '"macOS"'],
  'sec-ch-ua-full-version': ['Sec-CH-UA-Full-Version', '"140.0.0.0"'],
  'sec-ch-ua-full-version-list': ['Sec-CH-UA-Full-Version-List', '"Chromium";v="140.0.0.0", "Google Chrome";v="140.0.0.0", "Not=A?Brand";v="24.0.0.0"']
};

for (const key of Object.keys(headers)) {
  if (replacements[key.toLowerCase()]) delete headers[key];
}
for (const pair of Object.values(replacements)) headers[pair[0]] = pair[1];

$done({ headers });
