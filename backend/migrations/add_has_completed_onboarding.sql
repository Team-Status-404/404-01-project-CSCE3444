-- UC-14: Interactive Educational Tooltips & Onboarding
-- Adds a boolean flag to track whether a user has dismissed the interactive tour.
-- Run this once against your Supabase/PostgreSQL database.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN NOT NULL DEFAULT FALSE;
