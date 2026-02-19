-- ============================================================
-- AI@IM Events — Field Trip Registration Tables
-- Run this entire script in: Supabase → SQL Editor → New query
-- Designed for a FRESH Supabase project.
-- ============================================================


-- ── 1. Registrations table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS field_trip_registrations (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  whatsapp   TEXT        NOT NULL,
  level      TEXT        NOT NULL,
  reason     TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE field_trip_registrations ENABLE ROW LEVEL SECURITY;

-- Students can register (anonymous INSERT)
DROP POLICY IF EXISTS "public_insert" ON field_trip_registrations;
CREATE POLICY "public_insert"
  ON field_trip_registrations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- No public SELECT (only service_role key can read)
DROP POLICY IF EXISTS "no_public_read" ON field_trip_registrations;
CREATE POLICY "no_public_read"
  ON field_trip_registrations FOR SELECT
  TO anon USING (false);


-- ── 2. Settings table (pause/resume toggle) ─────────────────
CREATE TABLE IF NOT EXISTS field_trip_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

ALTER TABLE field_trip_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (to check if registrations are paused)
DROP POLICY IF EXISTS "public_read_settings" ON field_trip_settings;
CREATE POLICY "public_read_settings"
  ON field_trip_settings FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only service_role can write settings (anon cannot update)
DROP POLICY IF EXISTS "no_public_update_settings" ON field_trip_settings;
CREATE POLICY "no_public_update_settings"
  ON field_trip_settings FOR UPDATE
  TO anon USING (false);

-- Seed default "not paused" state
INSERT INTO field_trip_settings (key, value)
VALUES ('registrations_paused', 'false')
ON CONFLICT (key) DO NOTHING;


-- ============================================================
-- ADMIN FULL-ACCESS GRANT
-- This gives the built-in "service_role" (used by your app's
-- SUPABASE_SERVICE_ROLE_KEY) unrestricted access to both tables,
-- bypassing RLS entirely — exactly what the admin dashboard needs.
-- ============================================================

GRANT ALL PRIVILEGES ON TABLE field_trip_registrations TO service_role;
GRANT ALL PRIVILEGES ON TABLE field_trip_settings      TO service_role;

-- Also grant usage on the public schema (safe no-op if already granted)
GRANT USAGE ON SCHEMA public TO service_role;
