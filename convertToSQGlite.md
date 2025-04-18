Step-by-Step SQLite Migration Guide
Step 1: Install Required Packages
npm install better-sqlite3 drizzle-orm @types/better-sqlite3
Step 2: Create SQLite Database Adapter File (server/db-sqlite.ts)
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '@shared/schema';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
// Create the data directory if it doesn't exist
const dataDir = join(process.cwd(), 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}
// Path to the SQLite database file
const dbPath = join(dataDir, 'app.db');
// Create or connect to the SQLite database
export const sqlite = new Database(dbPath);
// Create the Drizzle ORM instance
export const db = drizzle(sqlite, { schema });
// Function to run migrations
export async function runMigrations() {
  try {
    console.log('Running SQLite migrations...');
    migrate(db, { migrationsFolder: './migrations' });
    console.log('SQLite migrations completed successfully.');
  } catch (error) {
    console.error('Error running SQLite migrations:', error);
    throw error;
  }
}
Step 3: Create SQLite-compatible Schema File (shared/sqlite-schema.ts)
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
// Define the base schema for a pose
export const poses = sqliteTable("poses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  url: text("url").notNull(),
  // In SQLite, we'll store JSON strings and parse them in the application
  keywords: text("keywords").default('[]'),
  // Difficulty classification: 1-Easy, 2-Medium, 3-Hard
  difficultyLevel: integer("difficulty_level").default(2),
  // Explanation for the difficulty classification
  difficultyReason: text("difficulty_reason"),
  // Optional pack ID for poses that are part of a pack
  packId: integer("pack_id"),
});
// Pose insert schema
export const insertPoseSchema = createInsertSchema(poses).pick({
  url: true,
  keywords: true,
  difficultyLevel: true,
  difficultyReason: true,
  packId: true,
});
// Pose types
export type InsertPose = z.infer<typeof insertPoseSchema>;
export type Pose = typeof poses.$inferSelect;
// Define schema for pose packs
export const posePacks = sqliteTable("pose_packs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  // Thumbnail image for the pack
  thumbnailUrl: text("thumbnail_url").notNull(),
  // Number of poses in this pack
  poseCount: integer("pose_count").notNull().default(0),
  // Category/tags for filtering (stored as JSON string)
  categories: text("categories").default('[]'),
  // Sample image URLs for preview (stored as JSON string)
  sampleImageUrls: text("sample_image_urls").default('[]'),
  // Price in cents (0 for free packs)
  price: integer("price").notNull().default(0),
  // Creation timestamp (stored as ISO string)
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});
// Pose pack insert schema
export const insertPosePackSchema = createInsertSchema(posePacks).pick({
  name: true,
  description: true,
  thumbnailUrl: true,
  poseCount: true,
  categories: true,
  sampleImageUrls: true,
  price: true,
});
// Pose pack types
export type InsertPosePack = z.infer<typeof insertPosePackSchema>;
export type PosePack = typeof posePacks.$inferSelect;
// Keep the users table as it was
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
// Music tracks table - will store references to user's local files
export const musicTracks = sqliteTable("music_tracks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  artist: text("artist"),
  duration: integer("duration"), // Duration in seconds
  filePath: text("file_path"), // For stored file paths (optional)
  // Use base64 encoding to store small files directly in the database if needed
  fileData: text("file_data"), // For storing small audio files directly (optional)
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});
export const insertMusicTrackSchema = createInsertSchema(musicTracks).pick({
  name: true,
  artist: true,
  duration: true,
  filePath: true,
  fileData: true,
});
export type InsertMusicTrack = z.infer<typeof insertMusicTrackSchema>;
export type MusicTrack = typeof musicTracks.$inferSelect;
// Playlists table
export const playlists = sqliteTable("playlists", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  // Store the tracks as a JSON string of track IDs
  trackIds: text("track_ids").default('[]'),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});
export const insertPlaylistSchema = createInsertSchema(playlists).pick({
  name: true,
  description: true,
  trackIds: true,
});
export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;
export type Playlist = typeof playlists.$inferSelect;
// Blog articles table
export const blogArticles = sqliteTable("blog_articles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  coverImage: text("cover_image"), // URL to cover image
  authorName: text("author_name").notNull(),
  publishedAt: text("published_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  featured: integer("featured").default(0), // 0 = not featured, 1 = featured
  tags: text("tags").default('[]'), // For filtering/categorizing articles
});
export const insertBlogArticleSchema = createInsertSchema(blogArticles).pick({
  title: true, 
  slug: true,
  summary: true,
  content: true,
  coverImage: true,
  authorName: true,
  publishedAt: true,
  featured: true,
  tags: true,
});
export type InsertBlogArticle = z.infer<typeof insertBlogArticleSchema>;
export type BlogArticle = typeof blogArticles.$inferSelect;
// Hosts table for modeling sessions
export const hosts = sqliteTable("hosts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  address: text("address"),
  contactNumber: text("contact_number"),
  email: text("email"),
  website: text("website"),
  notes: text("notes"),
  rating: integer("rating").notNull().default(5), // 1-5 star rating
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});
export const insertHostSchema = createInsertSchema(hosts).pick({
  name: true,
  address: true,
  contactNumber: true,
  email: true,
  website: true,
  notes: true,
  rating: true,
});
export type InsertHost = z.infer<typeof insertHostSchema>;
export type Host = typeof hosts.$inferSelect;
// Modeling sessions table
export const modelingSessions = sqliteTable("modeling_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  hostId: integer("host_id").notNull(), // Foreign key to hosts table
  hostName: text("host_name").notNull(), // Denormalized for convenience
  hostContactInfo: text("host_contact_info"),
  sessionDate: text("session_date").notNull(), // SQLite doesn't have a dedicated date type
  startTime: text("start_time"), // Session start time (optional)
  endTime: text("end_time"), // Session end time (optional)
  pay: real("pay"), // Payment amount (optional)
  notes: text("notes"),
  rating: integer("rating").notNull().default(5), // 1-5 star rating
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});
export const insertModelingSessionSchema = createInsertSchema(modelingSessions).pick({
  title: true,
  hostId: true,
  hostName: true,
  hostContactInfo: true,
  sessionDate: true,
  startTime: true,
  endTime: true,
  pay: true,
  notes: true,
  rating: true,
});
export type InsertModelingSession = z.infer<typeof insertModelingSessionSchema>;
export type ModelingSession = typeof modelingSessions.$inferSelect;
Step 4: Create a Data Migration Script (server/migrate.ts)
import { db as pgDb } from './db'; // PostgreSQL connection
import { db as sqliteDb } from './db-sqlite'; // SQLite connection
import * as pgSchema from '@shared/schema'; // PostgreSQL schema
import * as sqliteSchema from '@shared/sqlite-schema'; // SQLite schema
import { eq } from 'drizzle-orm';
async function migrateData() {
  console.log('Starting data migration from PostgreSQL to SQLite...');
  try {
    // 1. Migrate users
    console.log('Migrating users...');
    const users = await pgDb.select().from(pgSchema.users);
    for (const user of users) {
      await sqliteDb.insert(sqliteSchema.users).values({
        id: user.id,
        username: user.username,
        password: user.password
      });
    }
    // 2. Migrate poses
    console.log('Migrating poses...');
    const poses = await pgDb.select().from(pgSchema.poses);
    for (const pose of poses) {
      await sqliteDb.insert(sqliteSchema.poses).values({
        id: pose.id,
        url: pose.url,
        keywords: JSON.stringify(pose.keywords),
        difficultyLevel: pose.difficultyLevel,
        difficultyReason: pose.difficultyReason,
        packId: pose.packId
      });
    }
    // 3. Migrate pose packs
    console.log('Migrating pose packs...');
    const posePacks = await pgDb.select().from(pgSchema.posePacks);
    for (const pack of posePacks) {
      await sqliteDb.insert(sqliteSchema.posePacks).values({
        id: pack.id,
        name: pack.name,
        description: pack.description,
        thumbnailUrl: pack.thumbnailUrl,
        poseCount: pack.poseCount,
        categories: JSON.stringify(pack.categories),
        sampleImageUrls: JSON.stringify(pack.sampleImageUrls),
        price: pack.price,
        createdAt: pack.createdAt ? new Date(pack.createdAt).toISOString() : new Date().toISOString()
      });
    }
    // 4. Migrate music tracks
    console.log('Migrating music tracks...');
    const musicTracks = await pgDb.select().from(pgSchema.musicTracks);
    for (const track of musicTracks) {
      await sqliteDb.insert(sqliteSchema.musicTracks).values({
        id: track.id,
        name: track.name,
        artist: track.artist,
        duration: track.duration,
        filePath: track.filePath,
        fileData: track.fileData,
        createdAt: track.createdAt ? new Date(track.createdAt).toISOString() : new Date().toISOString()
      });
    }
    // 5. Migrate playlists
    console.log('Migrating playlists...');
    const playlists = await pgDb.select().from(pgSchema.playlists);
    for (const playlist of playlists) {
      await sqliteDb.insert(sqliteSchema.playlists).values({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        trackIds: JSON.stringify(playlist.trackIds),
        createdAt: playlist.createdAt ? new Date(playlist.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: playlist.updatedAt ? new Date(playlist.updatedAt).toISOString() : new Date().toISOString()
      });
    }
    // 6. Migrate blog articles
    console.log('Migrating blog articles...');
    const blogArticles = await pgDb.select().from(pgSchema.blogArticles);
    for (const article of blogArticles) {
      await sqliteDb.insert(sqliteSchema.blogArticles).values({
        id: article.id,
        title: article.title,
        slug: article.slug,
        summary: article.summary,
        content: article.content,
        coverImage: article.coverImage,
        authorName: article.authorName,
        publishedAt: article.publishedAt ? new Date(article.publishedAt).toISOString() : new Date().toISOString(),
        updatedAt: article.updatedAt ? new Date(article.updatedAt).toISOString() : new Date().toISOString(),
        featured: article.featured,
        tags: JSON.stringify(article.tags)
      });
    }
    // 7. Migrate hosts
    console.log('Migrating hosts...');
    const hosts = await pgDb.select().from(pgSchema.hosts);
    for (const host of hosts) {
      await sqliteDb.insert(sqliteSchema.hosts).values({
        id: host.id,
        name: host.name,
        address: host.address,
        contactNumber: host.contactNumber,
        email: host.email,
        website: host.website,
        notes: host.notes,
        rating: host.rating,
        createdAt: host.createdAt ? new Date(host.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: host.updatedAt ? new Date(host.updatedAt).toISOString() : new Date().toISOString()
      });
    }
    // 8. Migrate modeling sessions
    console.log('Migrating modeling sessions...');
    const modelingSessions = await pgDb.select().from(pgSchema.modelingSessions);
    for (const session of modelingSessions) {
      await sqliteDb.insert(sqliteSchema.modelingSessions).values({
        id: session.id,
        title: session.title,
        hostId: session.hostId,
        hostName: session.hostName,
        hostContactInfo: session.hostContactInfo,
        sessionDate: session.sessionDate ? new Date(session.sessionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        startTime: session.startTime,
        endTime: session.endTime,
        pay: session.pay,
        notes: session.notes,
        rating: session.rating,
        createdAt: session.createdAt ? new Date(session.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: session.updatedAt ? new Date(session.updatedAt).toISOString() : new Date().toISOString()
      });
    }
    console.log('Data migration completed successfully!');
  } catch (error) {
    console.error('Error during data migration:', error);
    throw error;
  }
}
export async function runMigration() {
  await migrateData();
}
Step 5: Update Storage Service (server/storage.ts)
import { IStorage } from './storage-new';
import { db } from './db-sqlite';
import * as schema from '@shared/sqlite-schema';
import { eq, like, ilike, or, and } from 'drizzle-orm';
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<schema.User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }
  async getUserByUsername(username: string): Promise<schema.User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return user;
  }
  async createUser(insertUser: schema.InsertUser): Promise<schema.User> {
    const [user] = await db.insert(schema.users).values(insertUser).returning();
    return user;
  }
  // Pose operations
  async getAllPoses(): Promise<schema.Pose[]> {
    return await db.select().from(schema.poses);
  }
  async getPosesByKeywords(keywords: string[]): Promise<schema.Pose[]> {
    const poses = await db.select().from(schema.poses);
    // For SQLite we have to do the filtering in JavaScript
    return poses.filter(pose => {
      const poseKeywords = JSON.parse(pose.keywords as string || '[]');
      return keywords.some(keyword => 
        poseKeywords.includes(keyword.toLowerCase())
      );
    });
  }
  async getPosesByDifficulty(difficultyLevel: number): Promise<schema.Pose[]> {
    return await db.select().from(schema.poses)
      .where(eq(schema.poses.difficultyLevel, difficultyLevel));
  }
  async getPosesByPackId(packId: number): Promise<schema.Pose[]> {
    return await db.select().from(schema.poses)
      .where(eq(schema.poses.packId, packId));
  }
  async createPose(pose: { url: string; packId?: number }): Promise<schema.Pose> {
    const insertData: schema.InsertPose = {
      url: pose.url,
      keywords: '[]',
      difficultyLevel: 2,
      packId: pose.packId
    };
    const [newPose] = await db.insert(schema.poses).values(insertData).returning();
    return newPose;
  }
  async updatePoseKeywords(id: number, keywords: string[]): Promise<schema.Pose | undefined> {
    const [updatedPose] = await db.update(schema.poses)
      .set({ keywords: JSON.stringify(keywords) })
      .where(eq(schema.poses.id, id))
      .returning();
    return updatedPose;
  }
  async updatePoseDifficulty(id: number, difficultyLevel: number, difficultyReason: string): Promise<schema.Pose | undefined> {
    const [updatedPose] = await db.update(schema.poses)
      .set({ 
        difficultyLevel, 
        difficultyReason 
      })
      .where(eq(schema.poses.id, id))
      .returning();
    return updatedPose;
  }
  async deletePose(id: number): Promise<boolean> {
    const result = await db.delete(schema.poses)
      .where(eq(schema.poses.id, id))
      .returning({ id: schema.poses.id });
    return result.length > 0;
  }
  async seedPoses(): Promise<void> {
    // Implementation for seeding poses in SQLite
    // ...
  }
  // Continue implementing the rest of the storage methods
  // using the same pattern for all entities:
  // - Music tracks
  // - Playlists
  // - Blog articles
  // - Hosts
  // - Modeling sessions
  // - Pose packs
  // Here's another example for pose packs:
  async getAllPosePacks(): Promise<schema.PosePack[]> {
    return await db.select().from(schema.posePacks);
  }
  async getPosePack(id: number): Promise<schema.PosePack | undefined> {
    const [posePack] = await db.select().from(schema.posePacks)
      .where(eq(schema.posePacks.id, id));
    return posePack;
  }
  async searchPosePacks(query: string): Promise<schema.PosePack[]> {
    // For SQLite we'll use JavaScript filtering
    const posePacks = await db.select().from(schema.posePacks);
    const lowerQuery = query.toLowerCase();
    
    return posePacks.filter(pack => 
      pack.name.toLowerCase().includes(lowerQuery) || 
      pack.description.toLowerCase().includes(lowerQuery) ||
      JSON.parse(pack.categories as string || '[]')
        .some((cat: string) => cat.toLowerCase().includes(lowerQuery))
    );
  }
  async createPosePack(pack: schema.InsertPosePack): Promise<schema.PosePack> {
    // Convert array props to JSON strings
    const insertData = {
      ...pack,
      categories: JSON.stringify(pack.categories || []),
      sampleImageUrls: JSON.stringify(pack.sampleImageUrls || [])
    };
    
    const [newPack] = await db.insert(schema.posePacks)
      .values(insertData)
      .returning();
    
    return newPack;
  }
  // Implement the rest of the methods...
}
export const storage = new DatabaseStorage();
Step 6: Update Main Server Index File (server/index.ts)
import express from 'express';
import { json, urlencoded } from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerRoutes } from './routes';
import { setupVite, serveStatic, log } from './vite';
import { Server } from 'http';
// For SQLite, make sure data directory exists
import { existsSync, mkdirSync } from 'fs';
const dataDir = path.join(process.cwd(), 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}
// Use db-sqlite instead of db
import './db-sqlite';
// Create express app
const app = express();
app.use(json({ limit: '5mb' }));
app.use(urlencoded({ extended: true }));
// Register API routes
let server: Server;
async function main() {
  server = await registerRoutes(app);
  
  // Set up Vite development server or serve static files
  if (process.env.NODE_ENV === 'production') {
    serveStatic(app);
    log(`serving on port ${process.env.PORT || 3000}`);
  } else {
    await setupVite(app, server);
  }
}
main().catch(err => {
  console.error(err);
  process.exit(1);
});
// Handle graceful shutdown
const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'] as const;
for (const signal of signals) {
  process.on(signal, () => {
    console.log(`Received ${signal}, closing server...`);
    server?.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
  });
}
Step 7: Update drizzle.config.ts for SQLite
import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();
export default defineConfig({
  schema: './shared/sqlite-schema.ts',
  out: './migrations',
  driver: 'better-sqlite',
  dbCredentials: {
    url: './data/app.db'
  }
});
Step 8: Helper Functions for SQLite Array Handling
Create a new file server/utils.ts:

/**
 * Helper functions for working with SQLite
 */
// Parse JSON string arrays from SQLite to JavaScript arrays
export function parseJsonArray(jsonStr: string | null | undefined): string[] {
  if (!jsonStr) return [];
  try {
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error parsing JSON array:', error);
    return [];
  }
}
// Convert JavaScript arrays to JSON strings for SQLite storage
export function stringifyArray(arr: any[] | null | undefined): string {
  if (!arr) return '[]';
  try {
    return JSON.stringify(arr);
  } catch (error) {
    console.error('Error stringifying array:', error);
    return '[]';
  }
}
// Helper for SQLite date handling
export function toSqliteDate(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  if (typeof date === 'string') {
    // Try to parse the string into a date
    try {
      date = new Date(date);
    } catch (e) {
      return null;
    }
  }
  return (date as Date).toISOString().split('T')[0];
}
// Helper for SQLite datetime handling
export function toSqliteDateTime(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  if (typeof date === 'string') {
    // Try to parse the string into a date
    try {
      date = new Date(date);
    } catch (e) {
      return null;
    }
  }
  return (date as Date).toISOString();
}
Additional Steps and Considerations:
1. JSON Handling
In PostgreSQL, you can use array and JSON column types directly. In SQLite, you need to:

Store arrays and JSON objects as strings
Parse them in your application code when retrieving from the database
Stringify them when saving to the database
2. Timestamp Handling
SQLite doesn't have native date/time types. Instead:

Store dates and times as ISO string format (or other string formats)
Use the SQLite datetime() function for date operations
Do date comparisons carefully
3. Foreign Keys
SQLite supports foreign keys but they need to be enabled:

// Add this to your db-sqlite.ts file
sqlite.exec('PRAGMA foreign_keys = ON;');
4. Transaction Support
SQLite supports transactions which are important for data integrity:

// Example transaction in db-sqlite.ts
export function withTransaction<T>(callback: () => T): T {
  sqlite.exec('BEGIN TRANSACTION');
  try {
    const result = callback();
    sqlite.exec('COMMIT');
    return result;
  } catch (error) {
    sqlite.exec('ROLLBACK');
    throw error;
  }
}
5. SQL Query Testing
Test your SQL queries thoroughly, as SQLite's SQL dialect has some differences from PostgreSQL.

6. Mobile/Offline Support
One of the main advantages of SQLite is offline support:

Consider adding client-side synchronization logic
Implement conflict resolution strategies
Add versioning to handle schema updates
7. Performance Considerations
SQLite is very efficient but has different optimization strategies:

Adding proper indexes is crucial
Use prepared statements for repeated queries
Vacuum the database periodically to reclaim space
By following these steps, you'll have a fully functional SQLite implementation ready for your application, with mobile offline support and improved portability.
