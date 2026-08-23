/*
 * YouTube Premium-like for Surge Web
 * Local-only response cleaner and HTML injector.
 * No outbound requests, account spoofing, or googlevideo segment blocking.
 */

const ARGS = (() => {
  try { return JSON.parse(typeof $argument === 'string' && $argument ? $argument : '{}'); }
  catch (_) { return {}; }
})();

const HIDE_SHORTS = ARGS.hideShorts === true;
const DEBUG = ARGS.debug === true;

const REMOVE_KEYS = new Set([
  'adPlacements', 'playerAds', 'adSlots', 'adBreakHeartbeatParams', 'adBreakParams',
  'adPlacementRenderer', 'adSlotRenderer', 'displayAdRenderer', 'inFeedAdLayoutRenderer',
  'promotedVideoRenderer', 'promotedSparklesWebRenderer', 'promotedSparklesTextSearchRenderer',
  'compactPromotedItemRenderer', 'compactPromotedVideoRenderer', 'carouselAdRenderer',
  'playerLegacyDesktopWatchAdsRenderer', 'videoMastheadAdRenderer', 'videoMastheadAdV3Renderer',
  'imageAdRenderer', 'inStreamVideoAdRenderer', 'companionAdsRenderer', 'companionAdRenderer',
  'enforcementMessageViewModel', 'adBlockerOverlay', 'adBlockDetected'
]);

const SHORTS_KEYS = new Set([
  'reelShelfRenderer', 'shortsShelfRenderer', 'reelItemRenderer',
  'shortsLockupViewModel', 'shortsLockupViewModelV2', 'compactReelRenderer'
]);

function clean(node, seen = new WeakSet(), depth = 0) {
  if (!node || typeof node !== 'object' || depth > 40 || seen.has(node)) return;
  seen.add(node);

  if (Array.isArray(node)) {
    for (let i = node.length - 1; i >= 0; i--) {
      const item = node[i];
      if (item && typeof item === 'object') {
        const keys = Object.keys(item);
        const isAd = keys.some((key) => REMOVE_KEYS.has(key));
        const isShorts = HIDE_SHORTS && keys.some((key) => SHORTS_KEYS.has(key));
        if (isAd || isShorts) {
          node.splice(i, 1);
          continue;
        }
        clean(item, seen, depth + 1);
      }
    }
    return;
  }

  for (const key of Object.keys(node)) {
    if (REMOVE_KEYS.has(key) || (HIDE_SHORTS && SHORTS_KEYS.has(key))) {
      delete node[key];
      continue;
    }
    clean(node[key], seen, depth + 1);
  }

  if (node.playerConfig && typeof node.playerConfig === 'object') {
    delete node.playerConfig.adPlacementConfig;
    delete node.playerConfig.adSignalsConfig;
  }
}

function findJsonEnd(text, start) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    if (ch === '}' && --depth === 0) return i + 1;
  }
  return -1;
}

function rewriteInlineJson(html, variable) {
  const marker = `var ${variable} = `;
  let cursor = 0;
  let result = '';
  while (true) {
    const index = html.indexOf(marker, cursor);
    if (index < 0) return result + html.slice(cursor);
    const start = index + marker.length;
    if (html[start] !== '{') {
      result += html.slice(cursor, start);
      cursor = start;
      continue;
    }
    const end = findJsonEnd(html, start);
    if (end < 0) return result + html.slice(cursor);
    let json = html.slice(start, end);
    try {
      const value = JSON.parse(json);
      clean(value);
      json = JSON.stringify(value);
    } catch (_) {}
    result += html.slice(cursor, start) + json;
    cursor = end;
  }
}

const CSS = `
#masthead-ad, #player-ads, .video-ads.ytp-ad-module,
ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer,
ytd-display-ad-renderer, ytd-promoted-video-renderer,
ytd-promoted-sparkles-web-renderer, ytd-promoted-sparkles-text-search-renderer,
ytd-banner-promo-renderer, ytd-companion-slot-renderer,
ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"],
yt-mealbar-promo-renderer, ytd-feed-nudge-renderer,
ytd-popup-container:has(a[href="/premium"]),
ytd-guide-entry-renderer:has(a[href^="/premium"]),
ytd-guide-entry-renderer:has(a[href*="youtube.com/premium"]),
ytd-enforcement-message-view-model,
tp-yt-paper-dialog:has(ytd-enforcement-message-view-model),
.ytp-ad-overlay-container, .ytp-ad-player-overlay, .ytp-ad-image-overlay {
  display: none !important;
}
ytd-rich-item-renderer:has(ytd-ad-slot-renderer),
ytd-rich-item-renderer:has(ytd-in-feed-ad-layout-renderer),
ytd-rich-item-renderer:has(ytd-display-ad-renderer),
ytd-rich-item-renderer:has(ytd-promoted-video-renderer),
ytd-rich-item-renderer:has(ytd-promoted-sparkles-web-renderer),
ytd-rich-grid-row:has(> #contents:empty) {
  display: none !important;
}
${HIDE_SHORTS ? `
ytd-reel-shelf-renderer, ytd-shorts-shelf-renderer, ytd-reel-item-renderer,
ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts]),
ytd-guide-entry-renderer:has(a[title="Shorts"]) { display: none !important; }
` : ''}
#surge-premium-pip {
  width: auto !important; min-width: 44px; padding: 0 8px !important;
  color: white; font: 600 12px/40px -apple-system, BlinkMacSystemFont, sans-serif;
}
#surge-premium-label {
  display: inline-flex; align-items: center; height: 32px; margin-left: 5px;
  color: var(--yt-spec-text-primary); font: 600 13px/32px -apple-system,
    BlinkMacSystemFont, "Segoe UI", sans-serif; letter-spacing: -.15px;
  white-space: nowrap;
}
`;

const PAGE_SCRIPT = `
(function () {
  'use strict';
  if (window.__surgePremiumLikeLoaded) return;
  window.__surgePremiumLikeLoaded = true;

  var AD_KEYS = new Set(${JSON.stringify(Array.from(REMOVE_KEYS))});
  var HIDE_SHORTS = ${HIDE_SHORTS ? 'true' : 'false'};
  var SHORTS_KEYS = new Set(${JSON.stringify(Array.from(SHORTS_KEYS))});

  function cleanValue(node, seen, depth) {
    if (!node || typeof node !== 'object' || depth > 40 || seen.has(node)) return node;
    seen.add(node);
    if (Array.isArray(node)) {
      for (var i = node.length - 1; i >= 0; i--) {
        var item = node[i];
        if (item && typeof item === 'object') {
          var keys = Object.keys(item);
          if (keys.some(function(k){ return AD_KEYS.has(k) || (HIDE_SHORTS && SHORTS_KEYS.has(k)); })) {
            node.splice(i, 1);
          } else cleanValue(item, seen, depth + 1);
        }
      }
      return node;
    }
    Object.keys(node).forEach(function (key) {
      if (AD_KEYS.has(key) || (HIDE_SHORTS && SHORTS_KEYS.has(key))) delete node[key];
      else cleanValue(node[key], seen, depth + 1);
    });
    return node;
  }

  function cleanObject(value) {
    try { return cleanValue(value, new WeakSet(), 0); } catch (_) { return value; }
  }

  function trap(name) {
    try {
      var value = cleanObject(window[name]);
      Object.defineProperty(window, name, {
        configurable: true,
        enumerable: true,
        get: function(){ return value; },
        set: function(next){ value = cleanObject(next); }
      });
    } catch (_) {}
  }

  trap('ytInitialPlayerResponse');
  trap('ytInitialData');

  var nativeFetch = window.fetch;
  if (nativeFetch) {
    window.fetch = function(input, init) {
      var promise = nativeFetch.apply(this, arguments);
      try {
        var url = typeof input === 'string' ? input : (input && input.url) || '';
        if (url.indexOf('/youtubei/v1/') === -1) return promise;
        return promise.then(function(response) {
          return response.clone().text().then(function(text) {
            try {
              var value = cleanObject(JSON.parse(text));
              var headers = new Headers(response.headers);
              headers.delete('content-length');
              headers.delete('content-encoding');
              return new Response(JSON.stringify(value), {
                status: response.status,
                statusText: response.statusText,
                headers: headers
              });
            } catch (_) { return response; }
          });
        });
      } catch (_) { return promise; }
    };
  }

  function player() {
    return document.getElementById('movie_player') || document.querySelector('.html5-video-player');
  }

  function video() {
    var p = player();
    return p && (p.querySelector('video.html5-main-video') || p.querySelector('video'));
  }

  var mutedByUs = null;

  function dismissAd() {
    try {
      var p = player();
      if (!p || !p.classList.contains('ad-showing')) return;
      var marker = p.querySelector('.ytp-ad-player-overlay,.ytp-ad-text,.video-ads,.ytp-ad-skip-button,.ytp-skip-ad-button');
      if (!marker) return;
      var v = video();
      if (v && !(v.muted && v.volume === 0)) {
        mutedByUs = v;
        v.muted = true;
        v.volume = 0;
      }
      var button = p.querySelector('.ytp-ad-skip-button-modern,.ytp-ad-skip-button,.ytp-skip-ad-button');
      if (button && !button.disabled) button.click();
      else if (v && Number.isFinite(v.duration) && v.duration > 0 && v.duration <= 180) v.currentTime = v.duration;
    } catch (_) {}
  }

  function restoreAudio() {
    try {
      var p = player(), v = video();
      if (p && v && mutedByUs === v && !p.classList.contains('ad-showing')) {
        v.muted = false;
        v.volume = 1;
        mutedByUs = null;
      }
    } catch (_) {}
  }

  function setPremiumLogo() {
    try {
      var logo = window.ytInitialData && window.ytInitialData.topbar &&
        window.ytInitialData.topbar.desktopTopbarRenderer &&
        window.ytInitialData.topbar.desktopTopbarRenderer.logo &&
        window.ytInitialData.topbar.desktopTopbarRenderer.logo.topbarLogoRenderer;
      if (logo && logo.iconImage) logo.iconImage.iconType = 'YOUTUBE_PREMIUM_LOGO';

      var anchor = document.querySelector('ytd-topbar-logo-renderer a#logo, ytd-topbar-logo-renderer #logo');
      if (anchor && !document.getElementById('surge-premium-label')) {
        var label = document.createElement('span');
        label.id = 'surge-premium-label';
        label.textContent = 'Premium';
        label.setAttribute('aria-hidden', 'true');
        anchor.appendChild(label);
        anchor.setAttribute('aria-label', 'YouTube Premium');
      }
    } catch (_) {}
  }

  var AD_MARKERS = [
    'ytd-ad-slot-renderer', 'ytd-in-feed-ad-layout-renderer',
    'ytd-display-ad-renderer', 'ytd-promoted-video-renderer',
    'ytd-promoted-sparkles-web-renderer', 'ytd-promoted-sparkles-text-search-renderer'
  ].join(',');

  var CONTENT_MARKERS = [
    'ytd-rich-grid-media', 'yt-lockup-view-model', 'ytd-video-renderer',
    'ytd-playlist-renderer', 'ytd-post-renderer', 'ytd-reel-item-renderer',
    'ytd-rich-section-renderer', 'a[href*="/watch"]', 'a[href*="/shorts/"]'
  ].join(',');

  function removeAdShells() {
    try {
      document.querySelectorAll('ytd-rich-item-renderer').forEach(function (item) {
        if (item.querySelector(AD_MARKERS)) {
          item.remove();
          return;
        }

        var hasContent = item.querySelector(CONTENT_MARKERS);
        var hasText = (item.textContent || '').trim().length > 0;
        if (hasContent || hasText) {
          delete item.dataset.surgeEmptySince;
          return;
        }

        var now = Date.now();
        var since = Number(item.dataset.surgeEmptySince || now);
        if (!item.dataset.surgeEmptySince) item.dataset.surgeEmptySince = String(now);
        else if (now - since > 1500) item.remove();
      });

      document.querySelectorAll('ytd-guide-entry-renderer a[href^="/premium"], ytd-guide-entry-renderer a[href*="youtube.com/premium"]')
        .forEach(function (entry) {
          var row = entry.closest('ytd-guide-entry-renderer');
          if (row) row.remove();
        });
    } catch (_) {}
  }

  function addPipButton() {
    try {
      var controls = document.querySelector('.ytp-right-controls');
      if (!controls || document.getElementById('surge-premium-pip')) return;
      var button = document.createElement('button');
      button.id = 'surge-premium-pip';
      button.className = 'ytp-button';
      button.textContent = 'PiP';
      button.title = '画中画';
      button.addEventListener('click', function() {
        var v = video();
        if (!v) return;
        if (v.requestPictureInPicture) v.requestPictureInPicture().catch(function(){});
        else if (v.webkitSupportsPresentationMode) v.webkitSetPresentationMode('picture-in-picture');
      });
      controls.insertBefore(button, controls.firstChild);
    } catch (_) {}
  }

  function sync() {
    cleanObject(window.ytInitialData);
    cleanObject(window.ytInitialPlayerResponse);
    setPremiumLogo();
    removeAdShells();
    addPipButton();
    dismissAd();
    restoreAudio();
  }

  var syncTimer = null;
  function scheduleSync() {
    if (syncTimer) return;
    syncTimer = setTimeout(function () { syncTimer = null; sync(); }, 60);
  }

  document.addEventListener('yt-navigate-finish', scheduleSync, true);
  document.addEventListener('DOMContentLoaded', sync, true);
  new MutationObserver(scheduleSync).observe(document.documentElement, { childList: true, subtree: true });
  setInterval(sync, 1000);
  setTimeout(sync, 0);
})();
`;

function inject(html) {
  if (html.indexOf('surge-premium-like-js') !== -1) return html;
  const block = `<style id="surge-premium-like-css">${CSS}</style><script id="surge-premium-like-js">${PAGE_SCRIPT}</script>`;
  const index = html.indexOf('<head>');
  return index >= 0 ? html.slice(0, index + 6) + block + html.slice(index + 6) : block + html;
}

function headersWithoutPageCsp(headers) {
  const result = Object.assign({}, headers || {});
  const blocked = new Set([
    'content-security-policy',
    'content-security-policy-report-only',
    'x-content-security-policy',
    'content-length'
  ]);
  for (const key of Object.keys(result)) {
    if (blocked.has(key.toLowerCase())) delete result[key];
  }
  return result;
}

(function main() {
  const url = ($request && $request.url) || '';
  let body = $response && $response.body;
  if (!body) { $done({}); return; }

  try {
    if (url.indexOf('/youtubei/v1/') !== -1) {
      const value = JSON.parse(body);
      clean(value);
      body = JSON.stringify(value);
      if (DEBUG) console.log('[YouTube Premium-like] processed API ' + url);
      $done({ body });
    } else {
      body = rewriteInlineJson(body, 'ytInitialData');
      body = rewriteInlineJson(body, 'ytInitialPlayerResponse');
      body = inject(body);
      if (DEBUG) console.log('[YouTube Premium-like] processed page ' + url);
      $done({ body, headers: headersWithoutPageCsp($response.headers) });
    }
  } catch (error) {
    if (DEBUG) console.log('[YouTube Premium-like] passthrough: ' + error);
    $done({});
  }
})();
