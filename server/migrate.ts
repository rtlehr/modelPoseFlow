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
    
    // Create hosts table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS hosts (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        contact_number TEXT,
        email TEXT,
        website TEXT,
        notes TEXT,
        rating INTEGER NOT NULL DEFAULT 5,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create modeling_sessions table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS modeling_sessions (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        host_id INTEGER NOT NULL,
        host_name TEXT NOT NULL,
        host_contact_info TEXT,
        session_date DATE NOT NULL,
        pay REAL,
        notes TEXT,
        rating INTEGER NOT NULL DEFAULT 5,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

// Run migration and export for programmatic use
migrate();
export { migrate };