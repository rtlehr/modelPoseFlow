import { 
  users, poses, 
  musicTracks, playlists, blogArticles,
  type User, type InsertUser, type Pose, type InsertPose,
  type MusicTrack, type InsertMusicTrack,
  type Playlist, type InsertPlaylist,
  type BlogArticle, type InsertBlogArticle
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

Limit your gesture drawings to 30 seconds to 2 minutes. This forces you to focus on the essential elements rather than details. As you progress, try even shorter timings of 15 or 30 seconds to sharpen your observation skills.

### Focus on Connections

Pay attention to how the major masses of the body (head, ribcage, pelvis) connect to each other. The way these forms tilt in relation to one another creates the gesture.

## Materials for Gesture Drawing

Keep your tools simple:
- A soft pencil (4B or softer)
- Charcoal stick
- Ballpoint pen
- A sketchbook that allows loose, fluid marks

Remember, gesture drawing isn't about perfect anatomy or details—it's about capturing life and movement in its most essential form. Practice regularly to develop your eye and hand coordination.
            `,
            coverImage: "https://images.unsplash.com/photo-1513364776144-60967b0f800f",
            authorName: "Michael Torres",
            publishedAt: new Date(2025, 3, 5), // April 5, 2025
            featured: 0,
            tags: ["gesture", "techniques", "quick sketches"]
          },
          {
            title: "Creating Form and Dimension in Figure Drawing",
            slug: "form-and-dimension-in-figure-drawing",
            summary: "Learn how to use value to create form and dimension in your figure drawings.",
            content: `
# Creating Form and Dimension in Figure Drawing

Understanding how to create convincing three-dimensional forms is crucial for effective figure drawing. Good technique helps convey volume, depth, and solidity in your artwork.

## The Elements of Form

When studying the figure, look for these key value relationships:

1. **Primary Planes**: The main directional planes of the figure (front, sides, back)
2. **Secondary Planes**: Smaller planes that define muscles and anatomical landmarks
3. **Transitions**: The subtle shifts between one plane and another
4. **Core Shadows**: The areas where form turns away most dramatically
5. **Highlighted Areas**: The parts of the form that are most prominent

## Techniques for Creating Volume

### Cross-Contour Lines

Draw lines that wrap around the form to show its three-dimensional quality. These lines follow the surface contours and help communicate volume.

### Directional Hatching

Use hatching lines that follow the form's surface direction. As the form turns, change the direction of your hatching to emphasize the turn.

### Form Shadow Mapping

Identify and carefully render the areas where forms turn away from the viewer. These shadows help define the boundaries between different planes.

## Methods for Rendering Form

### Cross-Hatching

Build up value gradually using intersecting lines. Vary the direction, spacing, and pressure to create different tones that follow the form.

### Blending

Use tools like blending stumps, tortillons, or your finger to smooth transitions between values. Be careful not to overblend, which can make drawings look flat.

### Value Scales

Practice creating a consistent 9-step value scale from white to black. Having control over your value range will give your drawings more depth and dimension.

## Tips for Creating Convincing Form

- Squint your eyes when looking at your subject to simplify forms and see the major planes
- Always establish your darkest darks and lightest lights early in the drawing
- Remember that transitions between planes are rarely uniform—look for subtle variations
- Pay attention to edge quality—sharp edges occur at the boundary between different planes on hard surfaces, while soft edges occur on rounded forms

Understanding form and volume is a lifelong study for artists. Regular practice from different angles will develop your ability to see and render three-dimensional form convincingly.
            `,
            coverImage: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b",
            authorName: "Sophia Williams",
            publishedAt: new Date(2025, 2, 25), // March 25, 2025
            featured: 0,
            tags: ["form", "volume", "technique", "value"]
          }
        ];
        
        // Insert sample articles
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
}

export const storage = new DatabaseStorage();
