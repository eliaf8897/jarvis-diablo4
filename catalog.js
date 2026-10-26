const express = require("express");
const { searchCatalog, getCatalogItem } = require("../db/repository");
const { getGuideCatalog } = require("../services/maxroll");
const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const result = await searchCatalog({
      q: String(req.query.q || "").slice(0, 100),
      category: String(req.query.category || ""),
      gameClass: String(req.query.class || ""),
      limit: req.query.limit || 50
    });
    res.json({ count: result.length, items: result, demoDataIncluded: result.some(x => x.demo === true || x.demo === "true") });
  } catch (e) { next(e); }
});
router.get("/guides", async (_req, res, next) => {
  try {
    if (process.env.MAXROLL_ENABLED !== "true") return res.json({ enabled: false, guides: [], message: "Importazione Maxroll disattivata nelle impostazioni del backend." });
    res.json({ enabled: true, ...(await getGuideCatalog()) });
  } catch (e) { next(e); }
});
router.get("/:id", async (req, res, next) => {
  try {
    const item = await getCatalogItem(req.params.id);
    if (!item) return res.status(404).json({ error: "Elemento non trovato." });
    res.json(item);
  } catch (e) { next(e); }
});
module.exports = { catalogRouter: router };
