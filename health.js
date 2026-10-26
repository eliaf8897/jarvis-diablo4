const express = require("express");
const { getPool } = require("../db/pool");
const router = express.Router();
router.get("/", async (_req, res) => {
  let database = "demo";
  const pool = getPool();
  if (pool) {
    try { await pool.query("SELECT 1"); database = "connected"; }
    catch { database = "error"; }
  }
  res.json({ ok: true, service: "jarvis-diablo4", database, time: new Date().toISOString() });
});
module.exports = { healthRouter: router };
