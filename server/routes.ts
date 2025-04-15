import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import fs from "fs";
import { analyzePoseDescription } from "./openai";
import { generatePoseSet, generateOpenPoseImage } from "./replicate";

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint to get all poses
  app.get("/api/poses", async (req, res) => {
    try {
      const poses = await storage.getAllPoses();
      res.json(poses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch poses" });
    }
  });

  // API endpoint to get poses by category
  app.get("/api/poses/:category", async (req, res) => {
    try {
      const category = req.params.category;
      const poses = await storage.getPosesByCategory(category);
      res.json(poses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch poses by category" });
    }
  });

  // API endpoint to analyze pose description and return matching poses
  app.post("/api/poses/analyze", async (req: Request, res: Response) => {
    try {
      const { description } = req.body;
      
      if (!description || typeof description !== 'string') {
        return res.status(400).json({ message: "Description is required and must be a string" });
      }
      
      const analysis = await analyzePoseDescription(description);
      
      // Get poses matching the identified categories
      const matchingPoses = await storage.getPosesByCategories(analysis.categories);
      
      res.json({
        analysis,
        poses: matchingPoses
      });
    } catch (error) {
      console.error("Error analyzing pose description:", error);
      res.status(500).json({ message: "Failed to analyze pose description" });
    }
  });
  
  // API endpoint to generate AI poses based on description
  app.post("/api/poses/generate", async (req: Request, res: Response) => {
    try {
      const { description, categories, count } = req.body;
      
      if (!description || typeof description !== 'string') {
        return res.status(400).json({ message: "Description is required and must be a string" });
      }
      
      if (!categories || !Array.isArray(categories) || categories.length === 0) {
        return res.status(400).json({ message: "At least one category is required" });
      }
      
      // Limit the number of poses to generate to prevent timeouts
      const poseCount = count && count > 0 ? Math.min(count, 5) : 3; 
      
      // Return a loading status immediately to let the client know we're processing
      res.status(202).json({ 
        message: "Pose generation started", 
        status: "processing",
        estimatedTime: poseCount * 20 // Increase time estimate (20 seconds per pose)
      });
      
      // Start the pose generation process asynchronously
      (async () => {
        try {
          console.log(`Starting generation of ${poseCount} poses for categories: ${categories.join(', ')}`);
          console.log(`Description: ${description}`);
          
          // Generate poses one by one instead of in parallel to avoid rate limits
          const generatedPoses = [];
          for (let i = 0; i < poseCount; i++) {
            const category = categories[i % categories.length];
            console.log(`Generating pose ${i+1}/${poseCount} for category: ${category}`);
            
            // Add variation to description for variety
            const variationText = i > 0 ? `, variation ${i + 1}` : '';
            const imageUrl = await generateOpenPoseImage(`${description}${variationText}`, category);
            
            if (imageUrl) {
              console.log(`Successfully generated pose ${i+1}: ${imageUrl}`);
              generatedPoses.push({
                url: imageUrl,
                category: category
              });
              
              // Save each pose to the database as it's generated
              await storage.createPose({
                category: category,
                url: imageUrl
              });
            } else {
              console.error(`Failed to generate pose ${i+1}`);
            }
          }
          
          console.log(`Generation complete. Successfully generated ${generatedPoses.length}/${poseCount} poses`);
          
        } catch (error) {
          console.error("Error in pose generation process:", error);
        }
      })();
    } catch (error) {
      console.error("Error processing pose generation request:", error);
      res.status(500).json({ message: "Failed to generate poses" });
    }
  });
  
  // Music track routes
  app.get("/api/music-tracks", async (_req: Request, res: Response) => {
    try {
      const tracks = await storage.getAllMusicTracks();
      res.json(tracks);
    } catch (error) {
      console.error("Error fetching music tracks:", error);
      res.status(500).json({ message: "Failed to fetch music tracks" });
    }
  });
  
  app.get("/api/music-tracks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid track ID" });
      }
      
      const track = await storage.getMusicTrack(id);
      if (!track) {
        return res.status(404).json({ message: "Track not found" });
      }
      
      res.json(track);
    } catch (error) {
      console.error("Error fetching music track:", error);
      res.status(500).json({ message: "Failed to fetch music track" });
    }
  });
  
  app.post("/api/music-tracks", async (req: Request, res: Response) => {
    try {
      const { name, artist, duration, filePath, fileData } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Track name is required" });
      }
      
      const track = await storage.createMusicTrack({
        name,
        artist,
        duration,
        filePath,
        fileData
      });
      
      res.status(201).json(track);
    } catch (error) {
      console.error("Error creating music track:", error);
      res.status(500).json({ message: "Failed to create music track" });
    }
  });
  
  app.put("/api/music-tracks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid track ID" });
      }
      
      const { name, artist, duration, filePath, fileData } = req.body;
      const updatedTrack = await storage.updateMusicTrack(id, {
        name,
        artist,
        duration,
        filePath,
        fileData
      });
      
      if (!updatedTrack) {
        return res.status(404).json({ message: "Track not found" });
      }
      
      res.json(updatedTrack);
    } catch (error) {
      console.error("Error updating music track:", error);
      res.status(500).json({ message: "Failed to update music track" });
    }
  });
  
  app.delete("/api/music-tracks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid track ID" });
      }
      
      const success = await storage.deleteMusicTrack(id);
      if (!success) {
        return res.status(404).json({ message: "Track not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting music track:", error);
      res.status(500).json({ message: "Failed to delete music track" });
    }
  });
  
  // Playlist routes
  app.get("/api/playlists", async (_req: Request, res: Response) => {
    try {
      const playlists = await storage.getAllPlaylists();
      res.json(playlists);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      res.status(500).json({ message: "Failed to fetch playlists" });
    }
  });
  
  app.get("/api/playlists/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid playlist ID" });
      }
      
      const playlist = await storage.getPlaylist(id);
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      
      res.json(playlist);
    } catch (error) {
      console.error("Error fetching playlist:", error);
      res.status(500).json({ message: "Failed to fetch playlist" });
    }
  });
  
  app.post("/api/playlists", async (req: Request, res: Response) => {
    try {
      const { name, description, trackIds } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Playlist name is required" });
      }
      
      const playlist = await storage.createPlaylist({
        name,
        description,
        trackIds
      });
      
      res.status(201).json(playlist);
    } catch (error) {
      console.error("Error creating playlist:", error);
      res.status(500).json({ message: "Failed to create playlist" });
    }
  });
  
  app.put("/api/playlists/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid playlist ID" });
      }
      
      const { name, description, trackIds } = req.body;
      const updatedPlaylist = await storage.updatePlaylist(id, {
        name,
        description,
        trackIds
      });
      
      if (!updatedPlaylist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      
      res.json(updatedPlaylist);
    } catch (error) {
      console.error("Error updating playlist:", error);
      res.status(500).json({ message: "Failed to update playlist" });
    }
  });
  
  app.delete("/api/playlists/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid playlist ID" });
      }
      
      const success = await storage.deletePlaylist(id);
      if (!success) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting playlist:", error);
      res.status(500).json({ message: "Failed to delete playlist" });
    }
  });
  
  const httpServer = createServer(app);

  return httpServer;
}
