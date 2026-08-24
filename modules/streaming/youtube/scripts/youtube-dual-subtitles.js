/**
 * YouTube Real-Time Dual Bilingual Subtitles Engine for Surge (High-Performance Parallel)
 * Author: nrhb11
 */

(async () => {
  const url = ($request && $request.url) || "";
  const rawBody = $response && $response.body;

  if (!rawBody || !url.includes("/api/timedtext")) {
    $done({});
    return;
  }

  console.log(`[DualSubs] Intercepted timedtext: ${url.substring(0, 80)}... (body length: ${rawBody.length})`);

  // Extract query parameters
  const urlObj = (() => {
    try { return new URL(url); } catch (_) { return null; }
  })();
  const lang = urlObj ? (urlObj.searchParams.get("lang") || urlObj.searchParams.get("tlang") || "") : "";
  
  // If the requested language is already native Chinese (e.g. video has official Chinese track), pass through
  if (lang === "zh-Hans" || lang === "zh-CN" || lang === "zh-TW" || lang === "zh-HK" || lang === "zh" || lang === "cmn" || lang === "yue") {
    // Only pass through if not an auto-translate request
    if (!urlObj.searchParams.get("tlang")) {
      console.log(`[DualSubs] Native Chinese track detected (${lang}), passing through.`);
      $done({});
      return;
    }
  }

  try {
    // 1. JSON3 Format (Modern Web & Mobile)
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

        console.log(`[DualSubs] Found ${textsToTranslate.length} valid subtitle sentences to translate.`);

        if (textsToTranslate.length > 0) {
          const t0 = Date.now();
          const translatedList = await translateAllParallel(textsToTranslate);
          console.log(`[DualSubs] Parallel translation finished in ${Date.now() - t0}ms.`);

          for (let i = 0; i < validEvents.length; i++) {
            const item = validEvents[i];
            const trans = translatedList[i];
            if (trans && trans !== item.original) {
              item.event.segs = [{ utf8: `${item.original}\n${trans}` }];
            }
          }
          console.log(`[DualSubs] Successfully injected bilingual subtitles! Returning modified body.`);
          $done({ body: JSON.stringify(json) });
          return;
        }
      }
    }

    // 2. XML Format (Legacy TimedText)
    if (rawBody.includes("<timedtext") || rawBody.includes("<transcript")) {
      const pMatches = [...rawBody.matchAll(/<p\s+([^>]*?)>([\s\S]*?)<\/p>/g)];
      if (pMatches.length > 0) {
        const texts = pMatches.map(m => m[2].replace(/<[^>]+>/g, "").trim());
        console.log(`[DualSubs] Found ${texts.length} XML subtitle sentences.`);
        const translatedList = await translateAllParallel(texts);
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

    // 3. WebVTT Format
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
        console.log(`[DualSubs] Found ${texts.length} WebVTT cues.`);
        const translatedList = await translateAllParallel(texts);
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

    console.log(`[DualSubs] Format not recognized or empty, passing through: ${rawBody.substring(0, 50)}`);
    $done({});
  } catch (err) {
    console.log(`[DualSubs] Error: ${err}`);
    $done({});
  }
})();

// Parallel Batch Translation Engine
async function translateAllParallel(texts, targetLang = "zh-CN") {
  if (!texts || texts.length === 0) return [];
  const CHUNK_SIZE = 80;
  const chunks = [];
  for (let c = 0; c < texts.length; c += CHUNK_SIZE) {
    chunks.push(texts.slice(c, c + CHUNK_SIZE));
  }

  const chunkPromises = chunks.map(chunk => translateChunk(chunk, targetLang));
  const chunkResults = await Promise.all(chunkPromises);
  return chunkResults.flat();
}

function translateChunk(chunk, targetLang) {
  const query = chunk.map((t, idx) => `[[[${idx}]]] ${t}`).join("\n");
  const apiUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(query)}`;

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.log(`[DualSubs] Translation chunk timed out.`);
      resolve(new Array(chunk.length).fill(""));
    }, 6000);

    if (typeof $httpClient !== "undefined" && $httpClient.get) {
      $httpClient.get({ url: apiUrl, headers: { "User-Agent": "Mozilla/5.0" } }, (error, response, data) => {
        clearTimeout(timeout);
        if (error || !data) {
          console.log(`[DualSubs] Translation request error: ${error}`);
          return resolve(new Array(chunk.length).fill(""));
        }
        resolve(parseTranslateResponse(data, chunk.length));
      });
    } else {
      clearTimeout(timeout);
      resolve(new Array(chunk.length).fill(""));
    }
  });
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
  } catch (err) {
    console.log(`[DualSubs] Parse response error: ${err}`);
    return new Array(expectedLength).fill("");
  }
}
