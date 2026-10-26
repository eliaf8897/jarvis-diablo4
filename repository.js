const fs = require("fs");
const path = require("path");
const { getPool } = require("./pool");

const seedPath = path.join(__dirname, "../../data/demo-catalog.json");
function readSeed() {
  return JSON.parse(fs.readFileSync(seedPath, "utf8"));
}
function matches(item, q, category, gameClass) {
  const haystack = [item.name, item.description, item.category, item.subcategory, item.class].filter(Boolean).join(" ").toLowerCase();
  return (!q || haystack.includes(q.toLowerCase())) &&
    (!category || category === "tutti" || item.category === category) &&
    (!gameClass || gameClass === "tutte" || !item.class || item.class === gameClass);
}
async function searchCatalog({ q = "", category = "", gameClass = "", limit = 50 }) {
  const pool = getPool();
  if (pool) {
    const params = [];
    const clauses = [];
    if (q) { params.push(`%${q}%`); clauses.push(`(name ILIKE $${params.length} OR description ILIKE $${params.length})`); }
    if (category && category !== "tutti") { params.push(category); clauses.push(`category = $${params.length}`); }
    if (gameClass && gameClass !== "tutte") { params.push(gameClass); clauses.push(`(game_class = $${params.length} OR game_class IS NULL)`); }
    params.push(Math.max(1, Math.min(Number(limit) || 50, 100)));
    const sql = `SELECT id, name, category, subcategory, description, game_class AS class, image_url, source_name, source_url, game_version, updated_at, is_demo AS demo FROM catalog_items ${clauses.length ? "WHERE " + clauses.join(" AND ") : ""} ORDER BY name LIMIT $${params.length}`;
    const result = await pool.query(sql, params);
    return result.rows;
  }
  return readSeed().items.filter(x => matches(x, q, category, gameClass)).slice(0, Math.max(1, Math.min(Number(limit) || 50, 100)));
}
async function getCatalogItem(id) {
  const pool = getPool();
  if (pool) {
    const r = await pool.query("SELECT id, name, category, subcategory, description, game_class AS class, image_url, source_name, source_url, game_version, updated_at, is_demo AS demo, payload FROM catalog_items WHERE id=$1", [id]);
    return r.rows[0] || null;
  }
  return readSeed().items.find(x => x.id === id) || null;
}
async function listBuilds() {
  const pool = getPool();
  if (pool) {
    const r = await pool.query("SELECT id, name, game_class AS class, goal, source_name, source_url, game_version, updated_at, is_demo AS demo, payload FROM builds ORDER BY updated_at DESC NULLS LAST LIMIT 100");
    return r.rows;
  }
  return readSeed().builds;
}
module.exports = { searchCatalog, getCatalogItem, listBuilds };
