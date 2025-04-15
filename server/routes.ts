import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import fs from "fs";
import { analyzePoseDescription, generatePoseKeywords } from "./openai";
import { Pose } from "../shared/schema";

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
  
  // API endpoint to create a new pose
  app.post("/api/poses", async (req: Request, res: Response) => {
    try {
      const { category, url } = req.body;
      
      if (!category || !url) {
        return res.status(400).json({ message: "Category and URL are required" });
      }
      
      // Validate category
      const validCategories = ["standing", "sitting", "reclining", "action"];
      if (!validCategories.includes(category)) {
        return res.status(400).json({ message: "Invalid category" });
      }
      
      // Create a new pose in storage
      const newPose = await storage.createPose({ category, url });
      
      return res.status(200).json(newPose);
    } catch (error) {
      console.error("Error creating pose:", error);
      return res.status(500).json({ message: "Failed to create pose" });
    }
  });
  
  // API endpoint to delete a pose
  app.delete("/api/poses/:id", async (req: Request, res: Response) => {
    try {
      const poseId = parseInt(req.params.id);
      
      if (isNaN(poseId)) {
        return res.status(400).json({ message: "Invalid pose ID" });
      }
      
      // Delete the pose
      const success = await storage.deletePose(poseId);
      
      if (!success) {
        return res.status(404).json({ message: "Pose not found" });
      }
      
      return res.status(204).end();
    } catch (error) {
      console.error("Error deleting pose:", error);
      return res.status(500).json({ message: "Failed to delete pose" });
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
      
      let matchingPoses: Pose[] = [];
      
      // Always try to match by keywords first - this is now our primary matching strategy
      if (analysis.keywords && analysis.keywords.length > 0) {
        console.log("Finding poses by keywords:", analysis.keywords);
        matchingPoses = await storage.getPosesByKeywords(analysis.keywords);
      }
      
      // Only if we have no keyword matches, fall back to categories
      if (matchingPoses.length === 0) {
        console.log("No keyword matches found, falling back to categories:", analysis.categories);
        matchingPoses = await storage.getPosesByCategories(analysis.categories);
      }
      
      // If we still don't have poses, get all poses as a last resort
      if (matchingPoses.length === 0) {
        console.log("No category matches found either, returning all poses");
        matchingPoses = await storage.getAllPoses();
      }
      
      res.json({
        analysis,
        poses: matchingPoses
      });
    } catch (error) {
      console.error("Error analyzing pose description:", error);
      res.status(500).json({ message: "Failed to analyze pose description" });
    }
  });
  
  // Pose keyword management endpoints
  app.post("/api/poses/:id/generate-keywords", async (req: Request, res: Response) => {
    try {
      const poseId = parseInt(req.params.id);
      
      if (isNaN(poseId)) {
        return res.status(400).json({ message: "Invalid pose ID" });
      }
      
      // Get the pose to access its image URL
      const poses = await storage.getAllPoses();
      const pose = poses.find(p => p.id === poseId);
      
      if (!pose || !pose.url) {
        return res.status(404).json({ message: "Pose not found or missing image URL" });
      }
      
      // Generate keywords for the pose image
      const keywords = await generatePoseKeywords(pose.url);
      
      // Update the pose with the generated keywords
      const updatedPose = await storage.updatePoseKeywords(poseId, keywords);
      
      return res.status(200).json({ pose: updatedPose, keywords });
    } catch (error) {
      console.error("Error generating pose keywords:", error);
      return res.status(500).json({ message: "Failed to generate pose keywords" });
    }
  });
  
  // Endpoint for manually updating pose keywords
  app.put("/api/poses/:id/keywords", async (req: Request, res: Response) => {
    try {
      const poseId = parseInt(req.params.id);
      const { keywords } = req.body;
      
      if (isNaN(poseId)) {
        return res.status(400).json({ message: "Invalid pose ID" });
      }
      
      if (!Array.isArray(keywords)) {
        return res.status(400).json({ message: "Keywords must be an array of strings" });
      }
      
      // Update the pose with the provided keywords
      const updatedPose = await storage.updatePoseKeywords(poseId, keywords);
      
      if (!updatedPose) {
        return res.status(404).json({ message: "Pose not found" });
      }
      
      return res.status(200).json({ pose: updatedPose });
    } catch (error) {
      console.error("Error updating pose keywords:", error);
      return res.status(500).json({ message: "Failed to update pose keywords" });
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
