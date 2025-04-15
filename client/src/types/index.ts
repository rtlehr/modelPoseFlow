export type PoseCategory = "standing" | "sitting" | "reclining" | "action" | "random";

export interface Pose {
  id: number;
  category: PoseCategory;
  url: string;
}

export interface PoseSessionConfig {
  categories: PoseCategory[];
  poseLength: number;
  sessionType: "count" | "time";
  poseCount: number;
  sessionTime: number;
  playlistId: number | null; // null means "No Music"
  useAiGenerated?: boolean; // Flag indicating if AI-generated poses should be used
  poseDescription?: string; // Description used for AI pose generation
}
