-- FTS5 virtual tables and triggers for full-text search
-- Hand-written migration (not managed by drizzle-kit)

-- ============================================================
-- 1. agents_fts
-- ============================================================

CREATE VIRTUAL TABLE IF NOT EXISTS agents_fts USING fts5(
  full_name,
  bio,
  suburbs_serviced,
  specializations,
  content='agents',
  content_rowid='id'
);

CREATE TRIGGER IF NOT EXISTS agents_fts_insert
AFTER INSERT ON agents
BEGIN
  INSERT INTO agents_fts(rowid, full_name, bio, suburbs_serviced, specializations)
  VALUES (new.id, new.full_name, new.bio, new.suburbs_serviced, new.specializations);
END;

CREATE TRIGGER IF NOT EXISTS agents_fts_update
AFTER UPDATE ON agents
BEGIN
  INSERT INTO agents_fts(agents_fts, rowid, full_name, bio, suburbs_serviced, specializations)
  VALUES ('delete', old.id, old.full_name, old.bio, old.suburbs_serviced, old.specializations);
  INSERT INTO agents_fts(rowid, full_name, bio, suburbs_serviced, specializations)
  VALUES (new.id, new.full_name, new.bio, new.suburbs_serviced, new.specializations);
END;

CREATE TRIGGER IF NOT EXISTS agents_fts_delete
AFTER DELETE ON agents
BEGIN
  INSERT INTO agents_fts(agents_fts, rowid, full_name, bio, suburbs_serviced, specializations)
  VALUES ('delete', old.id, old.full_name, old.bio, old.suburbs_serviced, old.specializations);
END;

-- ============================================================
-- 2. agencies_fts
-- ============================================================

CREATE VIRTUAL TABLE IF NOT EXISTS agencies_fts USING fts5(
  name,
  brand_name,
  suburb,
  description,
  content='agencies',
  content_rowid='id'
);

CREATE TRIGGER IF NOT EXISTS agencies_fts_insert
AFTER INSERT ON agencies
BEGIN
  INSERT INTO agencies_fts(rowid, name, brand_name, suburb, description)
  VALUES (new.id, new.name, new.brand_name, new.suburb, new.description);
END;

CREATE TRIGGER IF NOT EXISTS agencies_fts_update
AFTER UPDATE ON agencies
BEGIN
  INSERT INTO agencies_fts(agencies_fts, rowid, name, brand_name, suburb, description)
  VALUES ('delete', old.id, old.name, old.brand_name, old.suburb, old.description);
  INSERT INTO agencies_fts(rowid, name, brand_name, suburb, description)
  VALUES (new.id, new.name, new.brand_name, new.suburb, new.description);
END;

CREATE TRIGGER IF NOT EXISTS agencies_fts_delete
AFTER DELETE ON agencies
BEGIN
  INSERT INTO agencies_fts(agencies_fts, rowid, name, brand_name, suburb, description)
  VALUES ('delete', old.id, old.name, old.brand_name, old.suburb, old.description);
END;

-- ============================================================
-- 3. suburbs_fts
-- ============================================================

CREATE VIRTUAL TABLE IF NOT EXISTS suburbs_fts USING fts5(
  name,
  postcode,
  local_government_area,
  content='suburbs',
  content_rowid='id'
);

CREATE TRIGGER IF NOT EXISTS suburbs_fts_insert
AFTER INSERT ON suburbs
BEGIN
  INSERT INTO suburbs_fts(rowid, name, postcode, local_government_area)
  VALUES (new.id, new.name, new.postcode, new.local_government_area);
END;

CREATE TRIGGER IF NOT EXISTS suburbs_fts_update
AFTER UPDATE ON suburbs
BEGIN
  INSERT INTO suburbs_fts(suburbs_fts, rowid, name, postcode, local_government_area)
  VALUES ('delete', old.id, old.name, old.postcode, old.local_government_area);
  INSERT INTO suburbs_fts(rowid, name, postcode, local_government_area)
  VALUES (new.id, new.name, new.postcode, new.local_government_area);
END;

CREATE TRIGGER IF NOT EXISTS suburbs_fts_delete
AFTER DELETE ON suburbs
BEGIN
  INSERT INTO suburbs_fts(suburbs_fts, rowid, name, postcode, local_government_area)
  VALUES ('delete', old.id, old.name, old.postcode, old.local_government_area);
END;
