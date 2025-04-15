import { pgTable, text, serial, integer, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define the base schema for a pose
export const poses = pgTable("poses", {
  id: serial("id").primaryKey(),
  category: text("category", { enum: ["standing", "sitting", "reclining", "action"] }).notNull(),
  url: text("url").notNull(),
});

// Pose insert schema
export const insertPoseSchema = createInsertSchema(poses).pick({
  category: true,
  url: true,
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
