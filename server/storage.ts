import { 
  users, poses, 
  musicTracks, playlists,
  type User, type InsertUser, type Pose, type InsertPose,
  type MusicTrack, type InsertMusicTrack,
  type Playlist, type InsertPlaylist
} from "@shared/schema";
import { db } from "./db";
import { eq, or, inArray } from "drizzle-orm";
import fs from "fs";
import path from "path";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Pose operations
  getAllPoses(): Promise<Pose[]>;
  getPosesByCategory(category: string): Promise<Pose[]>;
  getPosesByCategories(categories: string[]): Promise<Pose[]>;
  createPose(pose: InsertPose): Promise<Pose>;
  seedPoses(): Promise<void>;
  
  // Music track operations
  getAllMusicTracks(): Promise<MusicTrack[]>;
  getMusicTrack(id: number): Promise<MusicTrack | undefined>;
  createMusicTrack(track: InsertMusicTrack): Promise<MusicTrack>;
  updateMusicTrack(id: number, track: Partial<InsertMusicTrack>): Promise<MusicTrack | undefined>;
  deleteMusicTrack(id: number): Promise<boolean>;
  
  // Playlist operations
  getAllPlaylists(): Promise<Playlist[]>;
  getPlaylist(id: number): Promise<Playlist | undefined>;
  createPlaylist(playlist: InsertPlaylist): Promise<Playlist>;
  updatePlaylist(id: number, playlist: Partial<InsertPlaylist>): Promise<Playlist | undefined>;
  deletePlaylist(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllPoses(): Promise<Pose[]> {
    return await db.select().from(poses);
  }

  async getPosesByCategory(category: string): Promise<Pose[]> {
    return await db.select().from(poses).where(eq(poses.category, category as any));
  }
  
  async getPosesByCategories(categories: string[]): Promise<Pose[]> {
    if (!categories || categories.length === 0) {
      return this.getAllPoses();
    }
    
    // Create an array of OR conditions for each category
    if (categories.length === 1) {
      return await db.select().from(poses).where(
        eq(poses.category, categories[0] as any)
      );
    }
    
    // For multiple categories, use OR conditions
    const conditions = categories.map(category => 
      eq(poses.category, category as any)
    );
    
    return await db.select().from(poses).where(
      or(...conditions)
    );
  }
  
  async createPose(insertPose: InsertPose): Promise<Pose> {
    const [pose] = await db
      .insert(poses)
      .values(insertPose)
      .returning();
    return pose;
  }

  async seedPoses(): Promise<void> {
    try {
      // Check if there are already poses in the database
      const existingPoses = await db.select().from(poses);
      
      if (existingPoses.length === 0) {
        // Only seed if there are no poses
        const data = fs.readFileSync(path.join(process.cwd(), 'data', 'poses.json'), 'utf8');
        const posesData: Pose[] = JSON.parse(data);
        
        // Insert poses in batches
        for (const pose of posesData) {
          await db.insert(poses).values({
            category: pose.category as any,
            url: pose.url
          });
        }
        
        console.log("Database seeded with poses successfully");
      } else {
        console.log("Database already contains poses, skipping seed");
      }
    } catch (error) {
      console.error("Failed to seed poses:", error);
      throw error;
    }
  }
  
  // Music track operations
  async getAllMusicTracks(): Promise<MusicTrack[]> {
    return await db.select().from(musicTracks);
  }
  
  async getMusicTrack(id: number): Promise<MusicTrack | undefined> {
    const [track] = await db.select().from(musicTracks).where(eq(musicTracks.id, id));
    return track || undefined;
  }
  
  async createMusicTrack(track: InsertMusicTrack): Promise<MusicTrack> {
    const [createdTrack] = await db
      .insert(musicTracks)
      .values(track)
      .returning();
    return createdTrack;
  }
  
  async updateMusicTrack(id: number, track: Partial<InsertMusicTrack>): Promise<MusicTrack | undefined> {
    const [updatedTrack] = await db
      .update(musicTracks)
      .set(track)
      .where(eq(musicTracks.id, id))
      .returning();
    return updatedTrack || undefined;
  }
  
  async deleteMusicTrack(id: number): Promise<boolean> {
    const result = await db
      .delete(musicTracks)
      .where(eq(musicTracks.id, id));
    return !!result;
  }
  
  // Playlist operations
  async getAllPlaylists(): Promise<Playlist[]> {
    return await db.select().from(playlists);
  }
  
  async getPlaylist(id: number): Promise<Playlist | undefined> {
    const [playlist] = await db.select().from(playlists).where(eq(playlists.id, id));
    return playlist || undefined;
  }
  
  async createPlaylist(playlist: InsertPlaylist): Promise<Playlist> {
    const [createdPlaylist] = await db
      .insert(playlists)
      .values(playlist)
      .returning();
    return createdPlaylist;
  }
  
  async updatePlaylist(id: number, playlist: Partial<InsertPlaylist>): Promise<Playlist | undefined> {
    const [updatedPlaylist] = await db
      .update(playlists)
      .set({
        ...playlist,
        updatedAt: new Date() // Update the updatedAt timestamp
      })
      .where(eq(playlists.id, id))
      .returning();
    return updatedPlaylist || undefined;
  }
  
  async deletePlaylist(id: number): Promise<boolean> {
    const result = await db
      .delete(playlists)
      .where(eq(playlists.id, id));
    return !!result;
  }
}

export const storage = new DatabaseStorage();
