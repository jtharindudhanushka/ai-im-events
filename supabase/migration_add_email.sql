-- Add Email column to field_trip_registrations
ALTER TABLE field_trip_registrations
ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';

-- Update RLS to allow email insertion (existing policies should cover it if they are on TABLE level, but good to verify)
-- Our previous policy "public_insert" was:
-- CREATE POLICY "public_insert" ON field_trip_registrations FOR INSERT TO anon, authenticated WITH CHECK (true);
-- This covers ALL columns, so no RLS change needed.

-- However, if you want enforce email is not null in future, you can add constraint.
-- For now, default '' is safer for existing rows.
