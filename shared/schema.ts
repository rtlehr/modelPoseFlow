import { pgTable, text, serial, integer, varchar, jsonb, timestamp, real, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define the base schema for a pose
export const poses = pgTable("poses", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  // Keywords are now the only method for pose matching
  keywords: text("keywords").array().default([]),
  // Difficulty classification: 1-Easy, 2-Medium, 3-Hard
  difficultyLevel: integer("difficulty_level").default(2),
  // Explanation for the difficulty classification
  difficultyReason: text("difficulty_reason"),
});

// Pose insert schema
export const insertPoseSchema = createInsertSchema(poses).pick({
  url: true,
  keywords: true,
  difficultyLevel: true,
  difficultyReason: true,
});

// Pose types
export type InsertPose = z.infer<typeof insertPoseSchema>;
export type Pose = typeof poses.$inferSelect;

// Keep the users table as it was
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
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
export const musicTracks = pgTable("music_tracks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  artist: text("artist"),
  duration: integer("duration"), // Duration in seconds
  filePath: text("file_path"), // For stored file paths (optional)
  // Use base64 encoding to store small files directly in the database if needed
  // Other approach would be just storing metadata and accessing files via File API
  fileData: text("file_data"), // For storing small audio files directly (optional)
  createdAt: timestamp("created_at").defaultNow(),
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
export const playlists = pgTable("playlists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  // Store the tracks as a JSON array of track IDs or a relation could be created separately
  trackIds: jsonb("track_ids").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPlaylistSchema = createInsertSchema(playlists).pick({
  name: true,
  description: true,
  trackIds: true,
});

export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;
export type Playlist = typeof playlists.$inferSelect;

// Blog articles table
export const blogArticles = pgTable("blog_articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  coverImage: text("cover_image"), // URL to cover image
  authorName: text("author_name").notNull(),
  publishedAt: timestamp("published_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  featured: integer("featured").default(0), // 0 = not featured, 1 = featured
  tags: text("tags").array().default([]), // For filtering/categorizing articles
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
export const hosts = pgTable("hosts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  contactNumber: text("contact_number"),
  email: text("email"),
  website: text("website"),
  notes: text("notes"),
  rating: integer("rating").notNull().default(5), // 1-5 star rating
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
export const modelingSessions = pgTable("modeling_sessions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  hostId: integer("host_id").notNull(), // Foreign key to hosts table
  hostName: text("host_name").notNull(), // Denormalized for convenience
  hostContactInfo: text("host_contact_info"),
  sessionDate: date("session_date").notNull(),
  startTime: text("start_time"), // Session start time (optional)
  endTime: text("end_time"), // Session end time (optional)
  pay: real("pay"), // Payment amount (optional)
  notes: text("notes"),
  rating: integer("rating").notNull().default(5), // 1-5 star rating
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
