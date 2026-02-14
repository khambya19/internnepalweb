ALTER TABLE "Jobs"
ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "StudentProfiles"
ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'enum_ViewLogs_targetType'
  ) THEN
    CREATE TYPE "enum_ViewLogs_targetType" AS ENUM ('job', 'student_profile');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "ViewLogs" (
  "id" UUID PRIMARY KEY,
  "viewerId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "targetType" "enum_ViewLogs_targetType" NOT NULL,
  "targetId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "unique_viewer_target"
ON "ViewLogs" ("viewerId", "targetType", "targetId");
