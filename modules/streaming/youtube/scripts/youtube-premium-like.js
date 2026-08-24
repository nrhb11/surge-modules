/* Pure YouTube/YouTube Music JSON ad cleaner for Surge. */

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
  if (!node || typeof node !== 'object' || depth > 40 || seen.has(node)) return;
  seen.add(node);

  if (Array.isArray(node)) {
    for (let i = node.length - 1; i >= 0; i--) {
      const item = node[i];
      if (!item || typeof item !== 'object') continue;
      const keys = Object.keys(item);
      const isAd = keys.some((key) => REMOVE_KEYS.has(key));
      const isShorts = HIDE_SHORTS && keys.some((key) => SHORTS_KEYS.has(key));
      if (isAd || isShorts) node.splice(i, 1);
      else {
        clean(item, seen, depth + 1);
        if (isVacantRendererShell(item)) node.splice(i, 1);
      }
    }
    return;
  }

  for (const key of Object.keys(node)) {
    if (REMOVE_KEYS.has(key) || (HIDE_SHORTS && SHORTS_KEYS.has(key))) delete node[key];
    else clean(node[key], seen, depth + 1);
  }

  if (node.playerConfig && typeof node.playerConfig === 'object') {
    delete node.playerConfig.adPlacementConfig;
    delete node.playerConfig.adSignalsConfig;
  }
}

(function main() {
  const url = ($request && $request.url) || '';
  const body = $response && $response.body;
  if (!body || !url.includes('/youtubei/v1/')) { $done({}); return; }

  try {
    const value = JSON.parse(body);
    clean(value);
    if (DEBUG) console.log('[YouTube Ads Cleaner] processed ' + url);
    $done({ body: JSON.stringify(value) });
  } catch (error) {
    if (DEBUG) console.log('[YouTube Ads Cleaner] passthrough: ' + error);
    $done({});
  }
})();
