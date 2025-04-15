import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import fs from "fs";
import { analyzePoseDescription } from "./openai";

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
  
  const httpServer = createServer(app);

  return httpServer;
}
