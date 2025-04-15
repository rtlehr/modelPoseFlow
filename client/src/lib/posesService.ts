import { Pose } from "@/types";
import { shuffleArray } from "./utils";

/**
 * Selects poses for a session based on keywords
 */
export function getPosesForSession(
  allPoses: Pose[],
  keywords: string[],
  count: number,
  randomize: boolean = true
): Pose[] {
  // Get available poses based on keywords
  let filteredPoses = allPoses;
  
  // Filter by keywords if specified
  if (keywords.length > 0) {
    filteredPoses = allPoses.filter(pose => {
      if (!pose.keywords || pose.keywords.length === 0) return false;
      
      // Match if any pose keyword contains or matches any of the requested keywords
      return pose.keywords.some(poseKeyword => 
        keywords.some(requestedKeyword => 
          poseKeyword.toLowerCase().includes(requestedKeyword.toLowerCase())
        )
      );
    });
  }
  
  // If no poses match, use all available poses as a fallback
  if (filteredPoses.length === 0) {
    console.log("No matching poses found by keywords, using all available poses");
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
