import { Pose, PoseCategory } from "@/types";
import { shuffleArray } from "./utils";

/**
 * Filters poses by categories and returns them randomly or sequentially
 */
export function getPosesForSession(
  allPoses: Pose[],
  categories: PoseCategory[],
  count: number,
  randomize: boolean = true
): Pose[] {
  // Check if random category is selected
  const isRandom = categories.includes("random");
  
  // If random is selected, use all poses regardless of category
  // Otherwise, filter poses by selected categories
  const filteredPoses = isRandom 
    ? allPoses 
    : allPoses.filter(pose => categories.includes(pose.category));
  
  if (filteredPoses.length === 0) {
    return [];
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
