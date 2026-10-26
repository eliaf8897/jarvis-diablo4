const express = require("express");
const { listBuilds } = require("../db/repository");
const { importGuide, importPlanner } = require("../services/maxroll");
const router = express.Router();

router.get("/", async (_req, res, next) => {
  try { res.json({ builds: await listBuilds() }); }
  catch (e) { next(e); }
});
router.post("/import-guide", async (req, res) => {
  if (process.env.MAXROLL_ENABLED !== "true") return res.status(403).json({ error: "Importazione Maxroll disattivata. Imposta MAXROLL_ENABLED=true nel backend." });
  try {
    const data = await importGuide(String(req.body?.url || ""));
    res.json({ ok: true, source: "Maxroll", data });
  } catch (e) { res.status(422).json({ error: e.message }); }
});
router.post("/import-planner", async (req, res) => {
  if (process.env.MAXROLL_ENABLED !== "true") return res.status(403).json({ error: "Importazione Maxroll disattivata. Imposta MAXROLL_ENABLED=true nel backend." });
  try {
    const data = await importPlanner(String(req.body?.url || ""));
    res.json({ ok: true, source: "Maxroll", data });
  } catch (e) { res.status(422).json({ error: e.message }); }
});
module.exports = { buildsRouter: router };
