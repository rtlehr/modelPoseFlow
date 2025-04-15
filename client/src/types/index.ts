export type PoseCategory = "standing" | "sitting" | "reclining" | "action";

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
}
