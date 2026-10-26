const ALLOWED_HOSTS = new Set(["maxroll.gg", "www.maxroll.gg"]);
function parseAllowedUrl(raw, mode) {
  let u;
  try { u = new URL(raw); } catch { throw new Error("Inserisci un URL valido."); }
  if (u.protocol !== "https:" || !ALLOWED_HOSTS.has(u.hostname)) throw new Error("Per sicurezza sono accettati solo URL HTTPS di maxroll.gg.");
  if (mode === "guide" && !u.pathname.startsWith("/d4/build-guides/")) throw new Error("L'URL deve essere una guida Diablo IV di Maxroll.");
  if (mode === "planner" && !/^\/d4\/planner\/[a-z0-9]+/i.test(u.pathname)) throw new Error("L'URL deve essere un Planner Diablo IV di Maxroll.");
  return u;
}
function extractPlannerIds(html) {
  const ids = new Set();
  const regexes = [
    /(?:https?:)?\/\/(?:www\.)?maxroll\.gg\/d4\/planner\/([a-z0-9]+)/gi,
    /\/d4\/planner\/([a-z0-9]+)/gi,
    /planners\.maxroll\.gg\/profiles\/(?:load\/)?d4\/([a-z0-9]+)/gi
  ];
  for (const re of regexes) {
    let match;
    while ((match = re.exec(html))) if (match[1] && match[1].length >= 5 && match[1].length <= 20) ids.add(match[1]);
  }
  return [...ids];
}
async function fetchRemote(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "JARVIS-DiabloIV-Companion/1.0 (public-data-import)", "Accept": "text/html,application/json,text/plain,*/*" },
    redirect: "follow",
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw new Error(`La fonte ha risposto HTTP ${response.status}.`);
  return response;
}
function normalizePlanner(id, body) {
  let parsed = body;
  if (parsed && typeof parsed.data === "string") {
    try { parsed = { ...parsed, data: JSON.parse(parsed.data) }; } catch {}
  }
  const data = parsed && parsed.data && typeof parsed.data === "object" ? parsed.data : parsed;
  return {
    id: `maxroll-planner-${id}`,
    plannerId: id,
    name: `Planner Maxroll ${id}`,
    category: "build",
    sourceName: "Maxroll",
    sourceUrl: `https://maxroll.gg/d4/planner/${id}`,
    importedAt: new Date().toISOString(),
    verified: false,
    verificationNote: "Importato dalla fonte; campi e significato devono essere verificati prima di trattarli come dati canonici.",
    profileCount: Array.isArray(data?.profiles) ? data.profiles.length : 0,
    profiles: Array.isArray(data?.profiles) ? data.profiles : [],
    items: data?.items && typeof data.items === "object" ? data.items : {},
    raw: parsed
  };
}
async function importPlanner(rawUrl) {
  const u = parseAllowedUrl(rawUrl, "planner");
  const match = u.pathname.match(/^\/d4\/planner\/([a-z0-9]+)/i);
  const id = match[1];
  const endpoint = `https://planners.maxroll.gg/profiles/load/d4/${encodeURIComponent(id)}`;
  const response = await fetchRemote(endpoint);
  let body;
  try { body = await response.json(); } catch { throw new Error("Il Planner non ha restituito JSON leggibile."); }
  return normalizePlanner(id, body);
}
async function importGuide(rawUrl) {
  const u = parseAllowedUrl(rawUrl, "guide");
  const response = await fetchRemote(u.href);
  const html = await response.text();
  const ids = extractPlannerIds(html);
  if (!ids.length) {
    throw new Error("La guida è stata letta, ma non è stato trovato un ID Planner nell'HTML pubblico. La pagina potrebbe caricarlo dinamicamente.");
  }
  const results = [];
  for (const id of ids.slice(0, 10)) {
    try {
      const imported = await importPlanner(`https://maxroll.gg/d4/planner/${id}`);
      results.push({ ok: true, ...imported });
    } catch (error) {
      results.push({ ok: false, plannerId: id, error: error.message });
    }
  }
  return { guideUrl: u.href, title: u.pathname.split("/").pop().replace(/-/g, " "), plannerIdsFound: ids, builds: results };
}
async function getGuideCatalog() {
  const urls = ["https://maxroll.gg/d4/build-guides", "https://maxroll.gg/d4/tierlists"];
  const map = new Map();
  const errors = [];
  for (const url of urls) {
    try {
      const response = await fetchRemote(url);
      const html = await response.text();
      const re = /href=["'](\/d4\/build-guides\/[^"'?#]+)["']/gi;
      let m;
      while ((m = re.exec(html))) {
        const link = `https://maxroll.gg${m[1]}`;
        if (!map.has(link)) map.set(link, { id: link, name: m[1].split("/").pop().replace(/-/g, " "), category: "build-guide", sourceName: "Maxroll", sourceUrl: link, verified: false });
      }
    } catch (e) { errors.push({ url, error: e.message }); }
  }
  return { count: map.size, complete: false, guides: [...map.values()].slice(0, 100), errors, note: "Catalogo best-effort: non garantisce tutte le guide e richiede verifica dopo cambiamenti del sito." };
}
module.exports = { importGuide, importPlanner, getGuideCatalog, extractPlannerIds };
