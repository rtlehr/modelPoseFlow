export interface Pose {
  id: number;
  url: string;
  keywords?: string[] | null;
}

export interface PoseSessionConfig {
  poseLength: number;
  sessionType: "count" | "time";
  poseCount: number;
  sessionTime: number;
  playlistId: number | null; // null means "No Music"
  // We'll keep the structure of the config to minimize changes
  // but we'll no longer use these fields
  keywords?: string[];
  description?: string;
}
