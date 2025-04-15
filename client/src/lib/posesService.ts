import { Pose, PoseCategory } from "@/types";
import { shuffleArray } from "./utils";

/**
 * Selects poses for a session - keywords are now the primary matching method
 * but we still use categories as a fallback for compatibility
 */
export function getPosesForSession(
  allPoses: Pose[],
  categories: PoseCategory[],
  count: number,
  randomize: boolean = true
): Pose[] {
  // Check if random category is selected
  const isRandom = categories.includes("random");
  
  // Get available poses based on selection criteria
  let filteredPoses = allPoses;
  
  // Only filter by categories if:
  // 1. Random is not selected
  // 2. We have specific categories to filter by
  if (!isRandom && categories.length > 0) {
    // NOTE: This is now a fallback method - in most cases, poses come pre-filtered
    // by keywords from the API, but we keep this for compatibility
    filteredPoses = allPoses.filter(pose => categories.includes(pose.category));
  }
  
  // If no poses match, use all available poses as a fallback
  if (filteredPoses.length === 0) {
    console.log("No matching poses found, using all available poses");
    filteredPoses = allPoses;
  }
  
  // If we need more poses than available, repeat them
  let sessionPoses: Pose[] = [];
  
  if (randomize) {
    // Create a random selection with possible repeats
    while (sessionPoses.length < count) {
      const shuffled = shuffleArray([...filteredPoses]);
      sessionPoses = [...sessionPoses, ...shuffled].slice(0, count);
    }
  } else {
    // Create a sequential selection with repeats as needed
    while (sessionPoses.length < count) {
      sessionPoses = [...sessionPoses, ...filteredPoses];
    }
    sessionPoses = sessionPoses.slice(0, count);
  }
  
  return sessionPoses;
}
