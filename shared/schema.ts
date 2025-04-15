import { pgTable, text, serial, integer, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define the base schema for a pose
export const poses = pgTable("poses", {
  id: serial("id").primaryKey(),
  // While we're transitioning to keyword-based selection, we keep the category field
  // but make it use a default value
  category: text("category", { enum: ["standing", "sitting", "reclining", "action"] })
    .default("standing")
    .notNull(),
  url: text("url").notNull(),
  // Keywords now play a more important role in pose selection
  keywords: text("keywords").array().default([]),
});

// Pose insert schema
export const insertPoseSchema = createInsertSchema(poses).pick({
  category: true,
  url: true,
  keywords: true,
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
