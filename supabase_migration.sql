-- ═══════════════════════════════════════
-- ADD user_id TO MEDICAL TABLES
-- Run this in Supabase SQL Editor AFTER creating the tables
-- ═══════════════════════════════════════

-- Add user_id column to each table
ALTER TABLE vaccines ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE deworming ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE vet_visits ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_vaccines_user ON vaccines (user_id);
CREATE INDEX IF NOT EXISTS idx_deworming_user ON deworming (user_id);
CREATE INDEX IF NOT EXISTS idx_vet_visits_user ON vet_visits (user_id);
