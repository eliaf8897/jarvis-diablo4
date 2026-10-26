const express = require("express");
const router = express.Router();
router.get("/", (_req, res) => {
  res.json({
    sources: [
      { id: "blizzard", name: "Blizzard", role: "Note patch e annunci ufficiali", url: "https://diablo4.blizzard.com/", status: "manual-verification-required" },
      { id: "maxroll", name: "Maxroll", role: "Guide e Planner", url: "https://maxroll.gg/d4/build-guides", status: process.env.MAXROLL_ENABLED === "true" ? "import-enabled-best-effort" : "disabled" },
      { id: "community-data", name: "Database community", role: "Dati strutturati da valutare", url: "https://github.com/DiabloTools/d4data", status: "license-and-schema-review-required" }
    ],
    policy: "Ogni fonte va verificata per copertura, versione e licenza. Dati demo e importazioni non verificate non vanno trattati come verità canonica."
  });
});
module.exports = { sourcesRouter: router };
