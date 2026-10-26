CREATE TABLE IF NOT EXISTS catalog_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT NOT NULL DEFAULT '',
  game_class TEXT,
  image_url TEXT,
  source_name TEXT NOT NULL DEFAULT 'unknown',
  source_url TEXT,
  game_version TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS catalog_items_name_idx ON catalog_items USING GIN (to_tsvector('simple', name));
CREATE INDEX IF NOT EXISTS catalog_items_category_idx ON catalog_items(category);
CREATE TABLE IF NOT EXISTS builds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  game_class TEXT NOT NULL,
  goal TEXT,
  source_name TEXT NOT NULL DEFAULT 'unknown',
  source_url TEXT,
  game_version TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE TABLE IF NOT EXISTS source_syncs (
  id BIGSERIAL PRIMARY KEY,
  source_name TEXT NOT NULL,
  source_url TEXT,
  status TEXT NOT NULL,
  records_seen INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);
