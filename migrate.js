require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { getPool } = require("../src/db/pool");
(async () => {
  const pool = getPool();
  if (!pool) throw new Error("DATABASE_URL mancante.");
  const sql = fs.readFileSync(path.join(__dirname, "../src/db/schema.sql"), "utf8");
  await pool.query(sql);
  console.log("Migrazioni completate.");
  await pool.end();
})().catch(e => { console.error(e.message); process.exit(1); });
