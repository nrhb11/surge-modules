// Bilibili web response filter for Surge. The browser userscript cited in README
// informed the placement of selectors; this is an independent implementation.
(function () {
  'use strict';

  const url = $request.url || '';
  const response = $response || {};
  const headers = response.headers || {};
  const body = response.body;
  if (response.status !== 200 || typeof body !== 'string') {
    $done({});
    return;
  }

  const getHeader = (name) => {
    const key = Object.keys(headers).find((item) => item.toLowerCase() === name);
    return key ? String(headers[key]) : '';
  };

  if (/^https:\/\/api\.bilibili\.com\/x\/web-interface\/wbi\/index\/top\/feed\/rcmd(?:\?|$)/.test(url)) {
    if (!/json/i.test(getHeader('content-type'))) {
      $done({});
      return;
    }
    try {
      const payload = JSON.parse(body);
      const items = payload && payload.data && payload.data.item;
      if (!Array.isArray(items)) {
        $done({});
        return;
      }
      const isAd = (item) => item && (
        item.is_ad === true || item.is_ad === 1 ||
        item.goto === 'ad' || item.goto === 'cm' ||
        (item.ad_info && typeof item.ad_info === 'object') ||
        /^https?:\/\/cm\.bilibili\.com\/cm\/api\//i.test(item.uri || '')
      );
      const filtered = items.filter((item) => !isAd(item));
      if (filtered.length === items.length) {
        $done({});
        return;
      }
      payload.data.item = filtered;
      $done({ body: JSON.stringify(payload) });
    } catch (error) {
      $done({});
    }
    return;
  }

  if (!/text\/html/i.test(getHeader('content-type')) || !/<\/head\s*>/i.test(body)) {
    $done({});
    return;
  }

  let options = {};
  try { options = JSON.parse(typeof $argument === 'string' ? $argument : '{}'); } catch (error) {}

  const common = [
    // Fixed ad slots on video pages. These are deliberately narrow selectors.
    '#slide_ad', '#slide-ad-exp', '.slide-ad-exp',
    '.ad-report.ad-floor-exp', '.ad-report.strip-ad',
    '.video-card-ad-small', '.video-page-game-card-small',
    '.video-page-special-card-small', '.palette-button-adcard',
    '.activity-m-v1.act-now', '.activity-m-v1.act-end',
    '#right-bottom-banner', '.right-bottom-banner.ad-report'
  ];
  const home = [
    // Bilibili inserts this warning into every carousel slide, including real videos.
    '.carousel-container .extension-tips-v2',
    '.feed-card:has(a[href*="cm.bilibili.com/cm/api/"])',
    '.floor-single-card:has(a[href*="cm.bilibili.com/cm/api/"])',
    '.carousel-area:has(a[href*="cm.bilibili.com/cm/api/"])',
    '.ad-report.ad-floor-exp.left-banner',
    '.fixed-card:has(a[href*="cm.bilibili.com/cm/api/"])'
  ];
  const search = [
    '.col_3:has(.bili-video-card a[href*="cm.bilibili.com/cm/api/"])',
    '.bili-video-card:has(a[href*="cm.bilibili.com/cm/api/"])'
  ];
  const live = [
    '#bannerAd', '.ad-report:has(a[href*="cm.bilibili.com/cm/api/"])'
  ];

  let selectors = [];
  if (/^https:\/\/www\.bilibili\.com\/(?:\?|$)/.test(url)) {
    selectors = common.concat(home);
    if (options.hideHomeLive !== false) {
      selectors.push('.floor-single-card:has(a[href*="live.bilibili.com/"])');
      selectors.push('.feed-card:has(.bili-live-card)');
    }
    if (options.hideCarousel === true) {
      selectors.push('.recommended-container_floor-aside .recommended-swipe');
    }
  } else if (/^https:\/\/www\.bilibili\.com\/video\//.test(url)) {
    selectors = common;
  } else if (/^https:\/\/search\.bilibili\.com\//.test(url)) {
    selectors = search;
  } else if (/^https:\/\/live\.bilibili\.com\//.test(url)) {
    selectors = live;
    if (options.hideLivePromo === true) {
      selectors.push('.player-area-ctnr.border-box.p-relative.t-center');
    }
  }

  if (selectors.length === 0 || body.includes('data-surge-bilibili-web-adblock')) {
    $done({});
    return;
  }

  const css = selectors.join(',\n') + '{display:none!important;}';
  const style = '<style data-surge-bilibili-web-adblock="1">' + css + '</style>';
  $done({ body: body.replace(/<\/head\s*>/i, style + '</head>') });
})();
