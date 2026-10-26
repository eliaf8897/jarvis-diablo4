const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || "https://eliaf8897.github.io";
app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json({ limit: "64kb" }));

const allowedHost = "maxroll.gg";
function getPlannerId(input) {
  let value;
  try { value = new URL(input); } catch { throw new Error("Inserisci un URL Maxroll valido."); }
  if (value.hostname !== allowedHost && !value.hostname.endsWith("." + allowedHost)) {
    throw new Error("Per ora sono accettati solo URL di maxroll.gg.");
  }
  const match = value.pathname.match(/\/d4\/planner\/([a-zA-Z0-9_-]+)/);
  if (!match) throw new Error("L'URL deve essere un planner Diablo IV, ad esempio maxroll.gg/d4/planner/ID.");
  return match[1];
}

app.get("/", (_req, res) => res.json({ service: "Jarvis Maxroll Importer", status: "online", endpoints: ["/api/health", "/api/import-planner"] }));
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.post("/api/import-planner", async (req, res) => {
  try {
    const plannerUrl = String(req.body?.url || "");
    const id = getPlannerId(plannerUrl);
    const url = `https://planners.maxroll.gg/profiles/load/d4/${encodeURIComponent(id)}`;
    const response = await fetch(url, {
      headers: { "Accept": "application/json", "User-Agent": "JarvisDiabloIVFanCompanion/1.0" },
      signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) return res.status(502).json({ error: `Maxroll ha risposto HTTP ${response.status}. Il planner potrebbe essere privato, cambiato o non disponibile.` });
    const raw = await response.json();
    res.set("Cache-Control", "no-store");
    res.json({
      ok: true,
      source: "Maxroll planner profile",
      plannerId: id,
      fetchedAt: new Date().toISOString(),
      note: "Dati del planner importati. Le classifiche e le guide di farming non sono contenute necessariamente nel planner.",
      data: raw
    });
  } catch (error) {
    res.status(400).json({ error: error.message || "Importazione non riuscita." });
  }
});

app.listen(PORT, () => console.log(`Jarvis Maxroll importer in ascolto sulla porta ${PORT}`));
