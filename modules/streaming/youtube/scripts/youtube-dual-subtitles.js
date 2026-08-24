/**
 * YouTube Real-Time Dual Bilingual Subtitles Engine for Surge
 * Author: nrhb11
 * Features:
 * - Translates foreign subtitles (English/Japanese/Korean/etc.) to Simplified Chinese in real time
 * - Renders original sentence (top) + translated sentence (bottom)
 * - Supports JSON3 (modern Web & Mobile), XML/SRV3, and WebVTT formats
 * - Completely independent from ad-blocking scripts
 */

(async () => {
  const url = ($request && $request.url) || "";
  const rawBody = $response && $response.body;

  if (!rawBody || !url.includes("/api/timedtext")) {
    $done({});
    return;
  }

  // If the subtitle is already Chinese, pass through directly
  const urlObj = (() => {
    try { return new URL(url); }
    catch (_) { return null; }
  })();
  const lang = urlObj ? (urlObj.searchParams.get("lang") || urlObj.searchParams.get("tlang") || "") : "";
  if (lang.startsWith("zh") || lang.startsWith("cmn") || lang.startsWith("yue")) {
    $done({});
    return;
  }

  try {
    // 1. Handle JSON3 Format (Modern Web & App)
    if (rawBody.trim().startsWith("{")) {
      const json = JSON.parse(rawBody);
      if (json.events && Array.isArray(json.events)) {
        const validEvents = [];
        const textsToTranslate = [];

        for (let i = 0; i < json.events.length; i++) {
          const ev = json.events[i];
          if (ev.segs && Array.isArray(ev.segs)) {
            const fullText = ev.segs.map(s => s.utf8 || "").join("").trim();
            if (fullText && fullText !== "\n") {
              validEvents.push({ event: ev, original: fullText });
              textsToTranslate.push(fullText);
            }
          }
        }

        if (textsToTranslate.length > 0) {
          const translatedList = await translateBatch(textsToTranslate);
          for (let i = 0; i < validEvents.length; i++) {
            const item = validEvents[i];
            const trans = translatedList[i];
            if (trans && trans !== item.original) {
              item.event.segs = [{ utf8: `${item.original}\n${trans}` }];
            }
          }
          $done({ body: JSON.stringify(json) });
          return;
        }
      }
    }

    // 2. Handle XML Format (Legacy TimedText)
    if (rawBody.includes("<timedtext") || rawBody.includes("<transcript")) {
      const pMatches = [...rawBody.matchAll(/<p\s+([^>]*?)>([\s\S]*?)<\/p>/g)];
      if (pMatches.length > 0) {
        const texts = pMatches.map(m => m[2].replace(/<[^>]+>/g, "").trim());
        const translatedList = await translateBatch(texts);
        let modifiedXml = rawBody;
        pMatches.forEach((m, idx) => {
          const trans = translatedList[idx];
          if (trans) {
            const originalContent = m[2];
            const newContent = `${originalContent}&#x000A;${trans}`;
            modifiedXml = modifiedXml.replace(m[0], `<p ${m[1]}>${newContent}</p>`);
          }
        });
        $done({ body: modifiedXml });
        return;
      }
    }

    // 3. Handle WebVTT Format
    if (rawBody.startsWith("WEBVTT")) {
      const lines = rawBody.split("\n");
      const cues = [];
      let currentCue = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes("-->")) {
          currentCue = { timeIndex: i, textLines: [] };
          cues.push(currentCue);
        } else if (currentCue && line.trim()) {
          currentCue.textLines.push({ lineIndex: i, text: line.trim() });
        } else if (!line.trim()) {
          currentCue = null;
        }
      }

      const texts = cues.map(c => c.textLines.map(t => t.text).join(" "));
      if (texts.length > 0) {
        const translatedList = await translateBatch(texts);
        cues.forEach((c, idx) => {
          const trans = translatedList[idx];
          if (trans && c.textLines.length > 0) {
            const lastLineObj = c.textLines[c.textLines.length - 1];
            lines[lastLineObj.lineIndex] += `\n${trans}`;
          }
        });
        $done({ body: lines.join("\n") });
        return;
      }
    }

    $done({});
  } catch (err) {
    console.log("[YouTube DualSubs] error, passing through: " + err);
    $done({});
  }
})();

// Google Translate Batch Processor
async function translateBatch(texts, targetLang = "zh-CN") {
  if (!texts || texts.length === 0) return [];
  const results = new Array(texts.length).fill("");
  const CHUNK_SIZE = 40;

  for (let c = 0; c < texts.length; c += CHUNK_SIZE) {
    const chunk = texts.slice(c, c + CHUNK_SIZE);
    const query = chunk.map((t, idx) => `[[[${idx}]]] ${t}`).join("\n");
    const apiUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(query)}`;

    const chunkResults = await new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(new Array(chunk.length).fill("")), 3500);

      if (typeof $httpClient !== "undefined" && $httpClient.get) {
        $httpClient.get({ url: apiUrl, headers: { "User-Agent": "Mozilla/5.0" } }, (error, response, data) => {
          clearTimeout(timeout);
          if (error || !data) return resolve(new Array(chunk.length).fill(""));
          resolve(parseTranslateResponse(data, chunk.length));
        });
      } else {
        clearTimeout(timeout);
        resolve(new Array(chunk.length).fill(""));
      }
    });

    for (let idx = 0; idx < chunk.length; idx++) {
      results[c + idx] = chunkResults[idx] || "";
    }
  }

  return results;
}

function parseTranslateResponse(raw, expectedLength) {
  try {
    const parsed = JSON.parse(raw);
    const fullText = parsed[0].map(x => x[0]).join("");
    const list = new Array(expectedLength).fill("");
    const regex = /\[\[\[(\d+)\]\]\]\s*([\s\S]*?)(?=\[\[\[\d+\]\]\]|$)/g;
    let match;
    while ((match = regex.exec(fullText)) !== null) {
      const idx = parseInt(match[1], 10);
      if (idx >= 0 && idx < expectedLength) {
        list[idx] = match[2].trim();
      }
    }
    return list;
  } catch (_) {
    return new Array(expectedLength).fill("");
  }
}
