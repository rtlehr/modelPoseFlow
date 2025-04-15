import { db, pool } from './db';
import { sql } from 'drizzle-orm';

async function migrate() {
  try {
    // Add difficulty_level column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE poses
      ADD COLUMN IF NOT EXISTS difficulty_level INTEGER DEFAULT 2,
      ADD COLUMN IF NOT EXISTS difficulty_reason TEXT;
    `);
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrate();