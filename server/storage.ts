import { users, type User, type InsertUser, type Pose } from "@shared/schema";
import fs from "fs";
import path from "path";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllPoses(): Promise<Pose[]>;
  getPosesByCategory(category: string): Promise<Pose[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private poses: Pose[];
  currentId: number;

  constructor() {
    this.users = new Map();
    this.poses = [];
    this.currentId = 1;
    this.loadPoses();
  }

  private loadPoses() {
    try {
      const data = fs.readFileSync(path.join(process.cwd(), 'data', 'poses.json'), 'utf8');
      this.poses = JSON.parse(data);
    } catch (error) {
      console.error("Failed to load poses:", error);
      this.poses = [];
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllPoses(): Promise<Pose[]> {
    return this.poses;
  }

  async getPosesByCategory(category: string): Promise<Pose[]> {
    return this.poses.filter(pose => pose.category === category);
  }
}

export const storage = new MemStorage();
