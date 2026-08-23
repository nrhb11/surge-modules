/* Remove ads from YouTube's initial homepage data without injecting page code. */

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
  'mealbarPromoRenderer', 'statementBannerRenderer', 'musicPremiumUpsellRenderer',
  'premiumUpsellLinkRenderer', 'enforcementMessageViewModel', 'adBlockerOverlay', 'adBlockDetected'
]);
const SHORTS_KEYS = new Set([
  'reelShelfRenderer', 'shortsShelfRenderer', 'reelItemRenderer',
  'shortsLockupViewModel', 'shortsLockupViewModelV2', 'compactReelRenderer'
]);
const SHELL_RENDERERS = new Set([
  'richItemRenderer', 'richSectionRenderer', 'itemSectionRenderer'
]);

function hasRenderableLeaf(node, seen = new WeakSet(), depth = 0) {
  if (!node || typeof node !== 'object' || depth > 40 || seen.has(node)) return false;
  seen.add(node);
  for (const key of Object.keys(node)) {
    if ((key.endsWith('Renderer') || key.endsWith('ViewModel')) && !SHELL_RENDERERS.has(key)) return true;
    if (hasRenderableLeaf(node[key], seen, depth + 1)) return true;
  }
  return false;
}

function isVacantRendererShell(node) {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return false;
  if (!Object.keys(node).some((key) => SHELL_RENDERERS.has(key))) return false;
  return !hasRenderableLeaf(node);
}

function clean(node, seen = new WeakSet(), depth = 0) {
  if (!node || typeof node !== 'object' || depth > 40 || seen.has(node)) return 0;
  seen.add(node);
  let removed = 0;

  if (Array.isArray(node)) {
    for (let i = node.length - 1; i >= 0; i--) {
      const item = node[i];
      if (!item || typeof item !== 'object') continue;
      const keys = Object.keys(item);
      if (keys.some((key) => REMOVE_KEYS.has(key)) ||
          (HIDE_SHORTS && keys.some((key) => SHORTS_KEYS.has(key)))) {
        node.splice(i, 1);
        removed++;
      } else {
        removed += clean(item, seen, depth + 1);
        if (isVacantRendererShell(item)) {
          node.splice(i, 1);
          removed++;
        }
      }
    }
    return removed;
  }

  for (const key of Object.keys(node)) {
    if (REMOVE_KEYS.has(key) || (HIDE_SHORTS && SHORTS_KEYS.has(key))) {
      delete node[key];
      removed++;
    } else {
      removed += clean(node[key], seen, depth + 1);
    }
  }
  return removed;
}

function jsonEnd(text, start) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const char = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === '{') depth++;
    else if (char === '}' && --depth === 0) return i + 1;
  }
  return -1;
}

function rewriteInitialData(html) {
  const markers = ['var ytInitialData = ', 'window["ytInitialData"] = ', 'ytInitialData = '];
  for (const marker of markers) {
    const markerIndex = html.indexOf(marker);
    if (markerIndex < 0) continue;
    const start = html.indexOf('{', markerIndex + marker.length);
    if (start < 0) continue;
    const end = jsonEnd(html, start);
    if (end < 0) continue;
    try {
      const value = JSON.parse(html.slice(start, end));
      const removed = clean(value);
      if (!removed) return { html, removed: 0 };
      return { html: html.slice(0, start) + JSON.stringify(value) + html.slice(end), removed };
    } catch (_) {}
  }
  return { html, removed: 0 };
}

function adjustedHeaders(headers) {
  const result = Object.assign({}, headers || {});
  for (const key of Object.keys(result)) {
    const lower = key.toLowerCase();
    if (lower === 'content-length' || lower === 'content-encoding') delete result[key];
  }
  return result;
}

(function main() {
  const body = $response && $response.body;
  if (!body) { $done({}); return; }
  const result = rewriteInitialData(body);
  if (!result.removed) { $done({}); return; }
  if (DEBUG) console.log('[YouTube Home Cleaner] removed ' + result.removed + ' ad nodes');
  $done({ body: result.html, headers: adjustedHeaders($response.headers) });
})();
