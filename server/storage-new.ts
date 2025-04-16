import { 
  users, poses, 
  musicTracks, playlists, blogArticles,
  hosts, modelingSessions,
  type User, type InsertUser, type Pose, type InsertPose,
  type MusicTrack, type InsertMusicTrack,
  type Playlist, type InsertPlaylist,
  type BlogArticle, type InsertBlogArticle,
  type Host, type InsertHost,
  type ModelingSession, type InsertModelingSession
} from "@shared/schema";
import { db } from "./db";
import { eq, or, inArray, desc } from "drizzle-orm";
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
  getPosesByKeywords(keywords: string[]): Promise<Pose[]>;
  getPosesByDifficulty(difficultyLevel: number): Promise<Pose[]>;
  createPose(pose: { url: string }): Promise<Pose>;
  updatePoseKeywords(id: number, keywords: string[]): Promise<Pose | undefined>;
  updatePoseDifficulty(id: number, difficultyLevel: number, difficultyReason: string): Promise<Pose | undefined>;
  deletePose(id: number): Promise<boolean>;
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
  
  // Blog article operations
  getAllBlogArticles(): Promise<BlogArticle[]>;
  getBlogArticle(id: number): Promise<BlogArticle | undefined>;
  getBlogArticleBySlug(slug: string): Promise<BlogArticle | undefined>;
  createBlogArticle(article: InsertBlogArticle): Promise<BlogArticle>;
  updateBlogArticle(id: number, article: Partial<InsertBlogArticle>): Promise<BlogArticle | undefined>;
  deleteBlogArticle(id: number): Promise<boolean>;
  seedBlogArticles(): Promise<void>;
  
  // Host operations
  getAllHosts(): Promise<Host[]>;
  getHost(id: number): Promise<Host | undefined>;
  createHost(host: InsertHost): Promise<Host>;
  updateHost(id: number, host: Partial<InsertHost>): Promise<Host | undefined>;
  deleteHost(id: number): Promise<boolean>;
  
  // Modeling session operations
  getAllModelingSessions(): Promise<ModelingSession[]>;
  getModelingSession(id: number): Promise<ModelingSession | undefined>;
  getModelingSessionsByHostId(hostId: number): Promise<ModelingSession[]>;
  createModelingSession(session: InsertModelingSession): Promise<ModelingSession>;
  updateModelingSession(id: number, session: Partial<InsertModelingSession>): Promise<ModelingSession | undefined>;
  deleteModelingSession(id: number): Promise<boolean>;
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

  // Category-based methods have been removed
  // All pose selection now uses keywords
  
  async getPosesByKeywords(keywords: string[]): Promise<Pose[]> {
    if (!keywords || keywords.length === 0) {
      return this.getAllPoses();
    }
    
    // Get all poses first and then filter by keywords in JS
    // This is because Drizzle ORM doesn't have a direct way to query array contains 
    // We could use SQL fragments for more efficiency in a production app
    const allPoses = await this.getAllPoses();
    
    // These are primary pose descriptors (weight=3)
    const primaryPoseWords = [
      "standing", "sitting", "lying", "prone", "supine", 
      "kneeling", "crouching", "squatting", "bending",
      "reclining", "leaning", "balancing"
    ];
    
    // Calculate a relevance score for each pose based on keyword matches
    // This implements a weighted scoring system that prioritizes:
    // 1. Primary pose keywords (standing, sitting) - highest weight
    // 2. Secondary pose parts (arms raised, legs bent) - medium weight 
    // 3. Details (fingers spread, slight angle) - lowest weight
    const scoredPoses = allPoses
      .map(pose => {
        const poseKeywords = pose.keywords || [];
        if (!Array.isArray(poseKeywords) || poseKeywords.length === 0) {
          return { pose, score: 0 };
        }
        
        let score = 0;
        
        // Calculate score based on keyword matches
        for (const searchKeyword of keywords) {
          const searchTerm = searchKeyword.toLowerCase();
          
          for (const poseKeyword of poseKeywords) {
            const poseWord = poseKeyword.toLowerCase();
            
            // Exact match gets higher score than partial match
            if (poseWord === searchTerm) {
              // Primary pose descriptors get highest weight (3x normal score)
              if (primaryPoseWords.some(primary => poseWord.includes(primary))) {
                score += 9; // 3x weight for primary pose words
              } else {
                score += 3; // Normal weight for exact match
              }
            }
            // Partial match (keyword is contained within pose keyword)
            else if (poseWord.includes(searchTerm) || searchTerm.includes(poseWord)) {
              // Primary pose descriptors get higher weight even for partial matches
              if (primaryPoseWords.some(primary => poseWord.includes(primary) || primary.includes(poseWord))) {
                score += 6; // 2x weight for primary pose words
              } else {
                score += 1; // Lowest weight for partial match
              }
            }
          }
        }
        
        return { pose, score };
      })
      .filter(item => item.score > 0) // Only keep poses with matches
      .sort((a, b) => b.score - a.score); // Sort by score (highest first)
    
    // Return poses sorted by relevance score
    console.log(`Found ${scoredPoses.length} poses with keyword matches, sorted by relevance`);
    return scoredPoses.map(item => item.pose);
  }
  
  async createPose(pose: { url: string }): Promise<Pose> {
    const insertData: InsertPose = {
      url: pose.url
    };
    
    const [createdPose] = await db
      .insert(poses)
      .values(insertData)
      .returning();
    
    return createdPose;
  }
  
  async updatePoseKeywords(id: number, keywords: string[]): Promise<Pose | undefined> {
    const [updatedPose] = await db
      .update(poses)
      .set({ keywords })
      .where(eq(poses.id, id))
      .returning();
    
    return updatedPose || undefined;
  }
  
  async updatePoseDifficulty(id: number, difficultyLevel: number, difficultyReason: string): Promise<Pose | undefined> {
    const [updatedPose] = await db
      .update(poses)
      .set({ difficultyLevel, difficultyReason })
      .where(eq(poses.id, id))
      .returning();
    
    return updatedPose || undefined;
  }
  
  async getPosesByDifficulty(difficultyLevel: number): Promise<Pose[]> {
    return await db
      .select()
      .from(poses)
      .where(eq(poses.difficultyLevel, difficultyLevel));
  }
  
  async deletePose(id: number): Promise<boolean> {
    const result = await db
      .delete(poses)
      .where(eq(poses.id, id));
    
    return !!result;
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
          // Only use url and keywords from the pose data
          await db.insert(poses).values({
            url: pose.url,
            keywords: pose.keywords || [] // Use keywords if available
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
  
  // Blog article operations
  async getAllBlogArticles(): Promise<BlogArticle[]> {
    // Get all blog articles ordered by publishedAt (newest first)
    return await db
      .select()
      .from(blogArticles)
      .orderBy(desc(blogArticles.publishedAt));
  }
  
  async getBlogArticle(id: number): Promise<BlogArticle | undefined> {
    const [article] = await db
      .select()
      .from(blogArticles)
      .where(eq(blogArticles.id, id));
    return article || undefined;
  }
  
  async getBlogArticleBySlug(slug: string): Promise<BlogArticle | undefined> {
    const [article] = await db
      .select()
      .from(blogArticles)
      .where(eq(blogArticles.slug, slug));
    return article || undefined;
  }
  
  async createBlogArticle(article: InsertBlogArticle): Promise<BlogArticle> {
    const [createdArticle] = await db
      .insert(blogArticles)
      .values(article)
      .returning();
    return createdArticle;
  }
  
  async updateBlogArticle(id: number, article: Partial<InsertBlogArticle>): Promise<BlogArticle | undefined> {
    const [updatedArticle] = await db
      .update(blogArticles)
      .set({
        ...article,
        updatedAt: new Date() // Update the updatedAt timestamp
      })
      .where(eq(blogArticles.id, id))
      .returning();
    return updatedArticle || undefined;
  }
  
  async deleteBlogArticle(id: number): Promise<boolean> {
    const result = await db
      .delete(blogArticles)
      .where(eq(blogArticles.id, id));
    return !!result;
  }
  
  async seedBlogArticles(): Promise<void> {
    try {
      // Check if there are already blog articles in the database
      const existingArticles = await db.select().from(blogArticles);
      
      if (existingArticles.length === 0) {
        // Sample blog articles
        const sampleArticles = [
          {
            title: "Understanding Figure Drawing Proportions",
            slug: "understanding-figure-drawing-proportions",
            summary: "Learn the fundamentals of human proportions to create more accurate figure drawings.",
            content: `
# Understanding Figure Drawing Proportions

When beginning figure drawing, understanding basic human proportions is essential for creating realistic and visually appealing artwork. This guide explores the classical proportions used by artists throughout history.

## The Eight-Head System

The most common proportional system used in figure drawing is the "eight-head" system, where the human figure is divided into eight equal parts, each measuring one head height:

1. **First head**: The head itself
2. **Second head**: From chin to nipple line
3. **Third head**: From nipple line to navel
4. **Fourth head**: From navel to crotch
5. **Fifth head**: From crotch to mid-thigh
6. **Sixth head**: From mid-thigh to below knee
7. **Seventh head**: From below knee to mid-calf
8. **Eighth head**: From mid-calf to sole of foot

Remember that these proportions are guidelines rather than rigid rules, and they vary between individuals. Many artists deliberately deviate from these proportions for stylistic effect.

## Variations Across Ages and Genders

- **Children**: Typically have larger heads proportionally - around 4-5 head heights total
- **Women**: Often depicted slightly shorter at 7.5 head heights with narrower shoulders
- **Men**: Typically have broader shoulders, approximately 2-3 head widths across

## Key Landmarks

Some key proportional relationships to remember:

- The distance from the fingertips to the elbow is approximately equal to the distance from the elbow to the shoulder
- The hand is roughly the same length as the face
- The foot is approximately the length of the forearm

Practice observing and measuring these proportions in your figure drawing sessions to develop your eye for human anatomy.
            `,
            coverImage: "https://images.unsplash.com/photo-1596464716127-f2a82984de30",
            authorName: "Emily Chen",
            publishedAt: new Date(2025, 3, 10), // April 10, 2025
            featured: 1,
            tags: ["anatomy", "fundamentals", "proportions"]
          },
          {
            title: "Mastering Gesture Drawing",
            slug: "mastering-gesture-drawing",
            summary: "Explore techniques for capturing movement and energy in quick gesture drawings.",
            content: `
# Mastering Gesture Drawing

Gesture drawing is the foundation of figure drawing. It's about capturing the movement, energy, and essential form of a pose in just seconds or minutes. This skill helps artists to establish dynamic and lively figures before adding details.

## What Makes an Effective Gesture Drawing?

A successful gesture drawing captures:

- The line of action - the primary curve that runs through the figure
- Weight distribution - how the figure is balanced
- Major forms - the simplified volumes of the torso, pelvis, and limbs
- Energy and movement - the dynamic quality of the pose

## Techniques for Better Gesture Drawings

### The C and S Curves

Look for the primary curves in the figure. Most poses can be broken down into C-curves and S-curves. These flowing lines create a sense of rhythm and movement.

### The Line of Action

Find the single line that best describes the flow of the entire pose. This line should run from the head through the torso and can extend to the primary leg bearing weight. All other elements should relate to this line.

### Quick Timing

Limit your gesture drawings to 30 seconds to 2 minutes. This forces you to focus on the essential elements rather than details. As you progress, try varying the time limits to challenge yourself.

Practice these techniques regularly, and you'll see significant improvements in your figure drawing skills.
            `,
            coverImage: "https://images.unsplash.com/photo-1513364776144-60967b0f800f",
            authorName: "Michael Torres",
            publishedAt: new Date(2025, 3, 12), // April 12, 2025
            featured: 0,
            tags: ["technique", "fundamentals", "gesture"]
          },
          {
            title: "Working with Professional Figure Models",
            slug: "working-with-professional-figure-models",
            summary: "Tips and etiquette for artists working with professional figure models for the first time.",
            content: `
# Working with Professional Figure Models

Professional figure models are essential partners in figure drawing. Understanding how to work with models respectfully and effectively will enhance your drawing experience and help create a positive studio environment.

## Setting Up the Space

Before the model arrives:

- Ensure the room is at a comfortable temperature (typically warmer than comfortable for clothed people)
- Provide a clean, stable platform or chair for the model to pose on
- Set up proper lighting that highlights the form without creating discomfort for the model
- Prepare a private changing area and robe for breaks

## Communication and Respect

- Discuss pose expectations clearly before beginning
- Never touch the model to adjust their position - use clear verbal directions instead
- Maintain professional language and avoid comments about the model's body
- Respect the model's time with clear break schedules (typically 5 minutes rest for every 25 minutes of posing)

## Planning Pose Sequences

When planning a drawing session:

- Begin with shorter poses (1-5 minutes) to warm up before longer poses
- Consider the difficulty of poses - more challenging poses should be shorter in duration
- Create a logical flow between poses to minimize strain on the model
- For longer poses (20+ minutes), ensure the position is sustainable and comfortable

By following these guidelines, you'll create a respectful, productive environment for both artists and models, leading to better drawing experiences and artistic growth.
            `,
            coverImage: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b",
            authorName: "Sophia Williams",
            publishedAt: new Date(2025, 3, 15), // April 15, 2025
            featured: 1,
            tags: ["professional", "models", "etiquette"]
          }
        ];
        
        // Insert blog articles
        for (const article of sampleArticles) {
          await db.insert(blogArticles).values(article);
        }
        
        console.log("Database seeded with blog articles successfully");
      } else {
        console.log("Database already contains blog articles, skipping seed");
      }
    } catch (error) {
      console.error("Failed to seed blog articles:", error);
      throw error;
    }
  }
  
  // Host operations
  async getAllHosts(): Promise<Host[]> {
    return await db
      .select()
      .from(hosts)
      .orderBy(desc(hosts.rating)); // Sort by rating (highest first)
  }
  
  async getHost(id: number): Promise<Host | undefined> {
    const [host] = await db
      .select()
      .from(hosts)
      .where(eq(hosts.id, id));
    return host || undefined;
  }
  
  async createHost(host: InsertHost): Promise<Host> {
    const [createdHost] = await db
      .insert(hosts)
      .values(host)
      .returning();
    return createdHost;
  }
  
  async updateHost(id: number, host: Partial<InsertHost>): Promise<Host | undefined> {
    const [updatedHost] = await db
      .update(hosts)
      .set({
        ...host,
        updatedAt: new Date()
      })
      .where(eq(hosts.id, id))
      .returning();
    return updatedHost || undefined;
  }
  
  async deleteHost(id: number): Promise<boolean> {
    const result = await db
      .delete(hosts)
      .where(eq(hosts.id, id));
    return !!result;
  }
  
  // Modeling session operations
  async getAllModelingSessions(): Promise<ModelingSession[]> {
    return await db
      .select()
      .from(modelingSessions)
      .orderBy(desc(modelingSessions.sessionDate)); // Sort by date (newest first)
  }
  
  async getModelingSession(id: number): Promise<ModelingSession | undefined> {
    const [session] = await db
      .select()
      .from(modelingSessions)
      .where(eq(modelingSessions.id, id));
    return session || undefined;
  }
  
  async getModelingSessionsByHostId(hostId: number): Promise<ModelingSession[]> {
    return await db
      .select()
      .from(modelingSessions)
      .where(eq(modelingSessions.hostId, hostId))
      .orderBy(desc(modelingSessions.sessionDate));
  }
  
  async createModelingSession(session: InsertModelingSession): Promise<ModelingSession> {
    const [createdSession] = await db
      .insert(modelingSessions)
      .values(session)
      .returning();
    return createdSession;
  }
  
  async updateModelingSession(id: number, session: Partial<InsertModelingSession>): Promise<ModelingSession | undefined> {
    const [updatedSession] = await db
      .update(modelingSessions)
      .set({
        ...session,
        updatedAt: new Date()
      })
      .where(eq(modelingSessions.id, id))
      .returning();
    return updatedSession || undefined;
  }
  
  async deleteModelingSession(id: number): Promise<boolean> {
    const result = await db
      .delete(modelingSessions)
      .where(eq(modelingSessions.id, id));
    return !!result;
  }
}

export const storage = new DatabaseStorage();