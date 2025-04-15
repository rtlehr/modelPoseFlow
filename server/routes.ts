import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import fs from "fs";

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

  const httpServer = createServer(app);

  return httpServer;
}
