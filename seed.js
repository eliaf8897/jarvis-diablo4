require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { getPool } = require("../src/db/pool");
(async () => {
  const pool = getPool();
  if (!pool) throw new Error("DATABASE_URL mancante.");
  const seed = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/demo-catalog.json"), "utf8"));
  for (const item of seed.items) {
    await pool.query(
      `INSERT INTO catalog_items (id,name,category,subcategory,description,game_class,image_url,source_name,source_url,game_version,is_demo,payload)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,$11)
       ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, payload=EXCLUDED.payload`,
      [item.id,item.name,item.category,item.subcategory||null,item.description||"",item.class||null,item.imageUrl||null,item.sourceName||"Jarvis demo",item.sourceUrl||null,item.gameVersion||null,item]
    );
  }
  for (const b of seed.builds) {
    await pool.query(
      `INSERT INTO builds (id,name,game_class,goal,source_name,source_url,game_version,is_demo,payload)
       VALUES ($1,$2,$3,$4,$5,$6,$7,true,$8)
       ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, payload=EXCLUDED.payload`,
      [b.id,b.name,b.class,b.goal,b.sourceName||"Jarvis demo",b.sourceUrl||null,b.gameVersion||null,b]
    );
  }
  console.log("Dataset demo inserito. Sostituire con dataset verificati prima di dichiarare il catalogo completo.");
  await pool.end();
})().catch(e => { console.error(e.message); process.exit(1); });
