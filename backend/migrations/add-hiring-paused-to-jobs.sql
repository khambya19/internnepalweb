-- Migration: Add hiringPaused column to Jobs table
-- Date: 2026-03-04
-- Description: Allows companies to temporarily pause accepting applications for a job

-- Add the hiringPaused column with default value false
ALTER TABLE "Jobs" ADD COLUMN IF NOT EXISTS "hiringPaused" BOOLEAN DEFAULT false;

-- Update existing jobs to have hiringPaused = false if null
UPDATE "Jobs" SET "hiringPaused" = false WHERE "hiringPaused" IS NULL;

-- Add index for better query performance when filtering by hiringPaused
CREATE INDEX IF NOT EXISTS "idx_jobs_hiring_paused" ON "Jobs" ("hiringPaused");

-- Verification query
-- SELECT id, title, status, "hiringPaused" FROM "Jobs" LIMIT 10;
