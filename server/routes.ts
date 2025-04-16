import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import fs from "fs";
import { analyzePoseDescription, generatePoseKeywords, analyzePoseDifficulty } from "./openai";
import { Pose, BlogArticle, Host, ModelingSession } from "../shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database with seed data
  await storage.seedPoses();
  await storage.seedBlogArticles();
  // API endpoint to get all poses
  app.get("/api/poses", async (req, res) => {
    try {
      const poses = await storage.getAllPoses();
      res.json(poses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch poses" });
    }
  });

  // Category-based endpoints have been removed
  // All pose selection now uses keywords
  
  // API endpoint to create a new pose
  app.post("/api/poses", async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ message: "URL is required" });
      }
      
      // Create a new pose in storage
      const newPose = await storage.createPose({ url });
      
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
      
      // Match by keywords (our only matching strategy now)
      if (analysis.keywords && analysis.keywords.length > 0) {
        console.log("Finding poses by keywords:", analysis.keywords);
        
        // Get poses that have keywords matching the requested keywords
        matchingPoses = await storage.getPosesByKeywords(analysis.keywords);
        
        // Client-side code will rank these poses by keyword match count
        // so poses with more matching keywords will be used first
        if (matchingPoses.length > 0) {
          console.log(`Found ${matchingPoses.length} poses with keyword matches`);
        }
      }
      
      // If we don't have poses, get all poses as a last resort
      if (matchingPoses.length === 0) {
        console.log("No keyword matches found, returning all poses");
        matchingPoses = await storage.getAllPoses();
      }
      
      // Filter by difficulty preference if specified
      if (analysis.difficultyPreference !== undefined && analysis.difficultyPreference !== null) {
        console.log(`Filtering poses by difficulty level: ${analysis.difficultyPreference}`);
        matchingPoses = matchingPoses.filter(pose => 
          pose.difficultyLevel === analysis.difficultyPreference
        );
        
        // If no poses match the exact difficulty, try to get poses with the requested difficulty
        if (matchingPoses.length === 0) {
          console.log(`No poses match the exact difficulty ${analysis.difficultyPreference}, fetching from database`);
          matchingPoses = await storage.getPosesByDifficulty(analysis.difficultyPreference);
        }
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
  
  // API endpoint to get poses by difficulty level
  app.get("/api/poses/difficulty/:level", async (req: Request, res: Response) => {
    try {
      const difficultyLevel = parseInt(req.params.level);
      
      if (isNaN(difficultyLevel) || difficultyLevel < 1 || difficultyLevel > 3) {
        return res.status(400).json({ 
          message: "Invalid difficulty level. Must be 1 (Easy), 2 (Medium), or 3 (Hard)" 
        });
      }
      
      const poses = await storage.getPosesByDifficulty(difficultyLevel);
      res.json(poses);
    } catch (error) {
      console.error("Error fetching poses by difficulty:", error);
      res.status(500).json({ message: "Failed to fetch poses by difficulty" });
    }
  });

  // API endpoint to analyze pose difficulty
  app.post("/api/poses/:id/analyze-difficulty", async (req: Request, res: Response) => {
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
      
      // Analyze the pose difficulty using OpenAI
      const difficultyAnalysis = await analyzePoseDifficulty(pose.url);
      
      // Update the pose with the difficulty information
      const updatedPose = await storage.updatePoseDifficulty(
        poseId, 
        difficultyAnalysis.difficultyLevel,
        difficultyAnalysis.difficultyReason
      );
      
      return res.status(200).json({ 
        pose: updatedPose, 
        difficultyLevel: difficultyAnalysis.difficultyLevel,
        difficultyReason: difficultyAnalysis.difficultyReason
      });
    } catch (error) {
      console.error("Error analyzing pose difficulty:", error);
      return res.status(500).json({ message: "Failed to analyze pose difficulty" });
    }
  });

  // API endpoint to manually update pose difficulty
  app.put("/api/poses/:id/difficulty", async (req: Request, res: Response) => {
    try {
      const poseId = parseInt(req.params.id);
      const { difficultyLevel, difficultyReason } = req.body;
      
      if (isNaN(poseId)) {
        return res.status(400).json({ message: "Invalid pose ID" });
      }
      
      if (!difficultyLevel || difficultyLevel < 1 || difficultyLevel > 3) {
        return res.status(400).json({ 
          message: "Invalid difficulty level. Must be 1 (Easy), 2 (Medium), or 3 (Hard)" 
        });
      }
      
      // Update the pose with the provided difficulty information
      const updatedPose = await storage.updatePoseDifficulty(
        poseId, 
        difficultyLevel,
        difficultyReason || ""
      );
      
      if (!updatedPose) {
        return res.status(404).json({ message: "Pose not found" });
      }
      
      return res.status(200).json({ pose: updatedPose });
    } catch (error) {
      console.error("Error updating pose difficulty:", error);
      return res.status(500).json({ message: "Failed to update pose difficulty" });
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
  
  // Blog article routes
  app.get("/api/blog-articles", async (_req: Request, res: Response) => {
    try {
      const articles = await storage.getAllBlogArticles();
      res.json(articles);
    } catch (error) {
      console.error("Error fetching blog articles:", error);
      res.status(500).json({ message: "Failed to fetch blog articles" });
    }
  });
  
  app.get("/api/blog-articles/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid article ID" });
      }
      
      const article = await storage.getBlogArticle(id);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      res.json(article);
    } catch (error) {
      console.error("Error fetching blog article:", error);
      res.status(500).json({ message: "Failed to fetch blog article" });
    }
  });
  
  app.get("/api/blog-articles/slug/:slug", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      
      if (!slug) {
        return res.status(400).json({ message: "Invalid article slug" });
      }
      
      const article = await storage.getBlogArticleBySlug(slug);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      res.json(article);
    } catch (error) {
      console.error("Error fetching blog article by slug:", error);
      res.status(500).json({ message: "Failed to fetch blog article" });
    }
  });
  
  app.post("/api/blog-articles", async (req: Request, res: Response) => {
    try {
      const { title, slug, summary, content, coverImage, authorName, tags, featured } = req.body;
      
      if (!title || !slug || !summary || !content || !authorName) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const article = await storage.createBlogArticle({
        title,
        slug,
        summary,
        content,
        coverImage,
        authorName,
        publishedAt: new Date(),
        featured: featured || 0,
        tags: tags || []
      });
      
      res.status(201).json(article);
    } catch (error) {
      console.error("Error creating blog article:", error);
      res.status(500).json({ message: "Failed to create blog article" });
    }
  });
  
  app.put("/api/blog-articles/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid article ID" });
      }
      
      const { title, slug, summary, content, coverImage, authorName, tags, featured } = req.body;
      const updatedArticle = await storage.updateBlogArticle(id, {
        title,
        slug,
        summary,
        content,
        coverImage,
        authorName,
        featured,
        tags
      });
      
      if (!updatedArticle) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      res.json(updatedArticle);
    } catch (error) {
      console.error("Error updating blog article:", error);
      res.status(500).json({ message: "Failed to update blog article" });
    }
  });
  
  app.delete("/api/blog-articles/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid article ID" });
      }
      
      const success = await storage.deleteBlogArticle(id);
      if (!success) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting blog article:", error);
      res.status(500).json({ message: "Failed to delete blog article" });
    }
  });
  
  // Host routes
  app.get("/api/hosts", async (_req: Request, res: Response) => {
    try {
      const hosts = await storage.getAllHosts();
      res.json(hosts);
    } catch (error) {
      console.error("Error fetching hosts:", error);
      res.status(500).json({ message: "Failed to fetch hosts" });
    }
  });
  
  app.get("/api/hosts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid host ID" });
      }
      
      const host = await storage.getHost(id);
      if (!host) {
        return res.status(404).json({ message: "Host not found" });
      }
      
      res.json(host);
    } catch (error) {
      console.error("Error fetching host:", error);
      res.status(500).json({ message: "Failed to fetch host" });
    }
  });
  
  app.post("/api/hosts", async (req: Request, res: Response) => {
    try {
      const { name, address, contactNumber, email, website, notes, rating } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Host name is required" });
      }
      
      // Default rating to 3 (middle value) if not provided
      const validatedRating = rating !== undefined ? rating : 3;
      
      const host = await storage.createHost({
        name,
        address,
        contactNumber,
        email,
        website,
        notes,
        rating: validatedRating
      });
      
      res.status(201).json(host);
    } catch (error) {
      console.error("Error creating host:", error);
      res.status(500).json({ message: "Failed to create host" });
    }
  });
  
  app.put("/api/hosts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid host ID" });
      }
      
      const { name, address, contactNumber, email, website, notes, rating } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Host name is required" });
      }
      
      const updatedHost = await storage.updateHost(id, {
        name,
        address,
        contactNumber,
        email,
        website,
        notes,
        rating
      });
      
      if (!updatedHost) {
        return res.status(404).json({ message: "Host not found" });
      }
      
      res.json(updatedHost);
    } catch (error) {
      console.error("Error updating host:", error);
      res.status(500).json({ message: "Failed to update host" });
    }
  });
  
  app.delete("/api/hosts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid host ID" });
      }
      
      const success = await storage.deleteHost(id);
      if (!success) {
        return res.status(404).json({ message: "Host not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting host:", error);
      res.status(500).json({ message: "Failed to delete host" });
    }
  });
  
  // Modeling session routes
  app.get("/api/modeling-sessions", async (_req: Request, res: Response) => {
    try {
      const sessions = await storage.getAllModelingSessions();
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching modeling sessions:", error);
      res.status(500).json({ message: "Failed to fetch modeling sessions" });
    }
  });
  
  app.get("/api/modeling-sessions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }
      
      const session = await storage.getModelingSession(id);
      if (!session) {
        return res.status(404).json({ message: "Modeling session not found" });
      }
      
      res.json(session);
    } catch (error) {
      console.error("Error fetching modeling session:", error);
      res.status(500).json({ message: "Failed to fetch modeling session" });
    }
  });
  
  app.get("/api/hosts/:hostId/modeling-sessions", async (req: Request, res: Response) => {
    try {
      const hostId = parseInt(req.params.hostId);
      if (isNaN(hostId)) {
        return res.status(400).json({ message: "Invalid host ID" });
      }
      
      const sessions = await storage.getModelingSessionsByHostId(hostId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching modeling sessions by host:", error);
      res.status(500).json({ message: "Failed to fetch modeling sessions by host" });
    }
  });
  
  app.post("/api/modeling-sessions", async (req: Request, res: Response) => {
    try {
      const { title, hostId, hostName, hostContactInfo, sessionDate, startTime, endTime, pay, notes, rating } = req.body;
      
      if (!title) {
        return res.status(400).json({ message: "Session title is required" });
      }
      
      if (!hostId || !hostName) {
        return res.status(400).json({ message: "Host information is required" });
      }
      
      if (!sessionDate) {
        return res.status(400).json({ message: "Session date is required" });
      }
      
      // Default rating to 3 (middle value) if not provided
      const validatedRating = rating !== undefined ? rating : 3;
      
      const session = await storage.createModelingSession({
        title,
        hostId,
        hostName,
        hostContactInfo,
        sessionDate,
        startTime,
        endTime,
        pay,
        notes,
        rating: validatedRating
      });
      
      res.status(201).json(session);
    } catch (error) {
      console.error("Error creating modeling session:", error);
      res.status(500).json({ message: "Failed to create modeling session" });
    }
  });
  
  app.put("/api/modeling-sessions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }
      
      const { title, hostId, hostName, hostContactInfo, sessionDate, startTime, endTime, pay, notes, rating } = req.body;
      
      if (!title) {
        return res.status(400).json({ message: "Session title is required" });
      }
      
      const updatedSession = await storage.updateModelingSession(id, {
        title,
        hostId,
        hostName,
        hostContactInfo,
        sessionDate,
        startTime,
        endTime,
        pay,
        notes,
        rating
      });
      
      if (!updatedSession) {
        return res.status(404).json({ message: "Modeling session not found" });
      }
      
      res.json(updatedSession);
    } catch (error) {
      console.error("Error updating modeling session:", error);
      res.status(500).json({ message: "Failed to update modeling session" });
    }
  });
  
  app.delete("/api/modeling-sessions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }
      
      const success = await storage.deleteModelingSession(id);
      if (!success) {
        return res.status(404).json({ message: "Modeling session not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting modeling session:", error);
      res.status(500).json({ message: "Failed to delete modeling session" });
    }
  });
  
  const httpServer = createServer(app);

  return httpServer;
}
