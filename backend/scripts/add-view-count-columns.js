// Script to add viewCount columns to Jobs and StudentProfiles tables
const { sequelize } = require('../src/config/database');

async function addViewCountColumns() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Add viewCount to Jobs table
    await sequelize.query(`
      ALTER TABLE "Jobs"
      ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0;
    `);
    console.log('✓ Added viewCount column to Jobs table');

    // Add viewCount to StudentProfiles table
    await sequelize.query(`
      ALTER TABLE "StudentProfiles"
      ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0;
    `);
    console.log('✓ Added viewCount column to StudentProfiles table');

    // Create ViewLogs table if it doesn't exist
    await sequelize.query(`
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
    `);
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "ViewLogs" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "viewerId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "targetType" "enum_ViewLogs_targetType" NOT NULL,
        "targetId" UUID NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✓ Created ViewLogs table');

    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "unique_viewer_target"
      ON "ViewLogs" ("viewerId", "targetType", "targetId");
    `);
    console.log('✓ Created unique index on ViewLogs');

    // Check current counts
    const [jobCount] = await sequelize.query('SELECT COUNT(*) as count FROM "Jobs"');
    const [profileCount] = await sequelize.query('SELECT COUNT(*) as count FROM "StudentProfiles"');
    
    console.log('\nCurrent data:');
    console.log(`- Jobs: ${jobCount[0].count}`);
    console.log(`- Student Profiles: ${profileCount[0].count}`);

    console.log('\n✅ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addViewCountColumns();
