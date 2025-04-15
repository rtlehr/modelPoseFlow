import { Pose } from "@/types";
import { shuffleArray } from "./utils";

interface ScoredPose {
  pose: Pose;
  score: number;
}

/**
 * Calculates how many keyword matches exist between the pose and requested keywords
 * This is used to rank poses by relevance to the user's description
 */
function calculateKeywordMatchScore(pose: Pose, requestedKeywords: string[]): number {
  if (!pose.keywords || pose.keywords.length === 0 || requestedKeywords.length === 0) {
    return 0;
  }

  let matchCount = 0;
  
  // For each keyword in the pose
  pose.keywords.forEach(poseKeyword => {
    const lowerPoseKeyword = poseKeyword.toLowerCase();
    
    // Check if any requested keyword matches or is contained within it
    requestedKeywords.forEach(requestedKeyword => {
      const lowerRequestedKeyword = requestedKeyword.toLowerCase();
      
      // Full match gets higher score
      if (lowerPoseKeyword === lowerRequestedKeyword) {
        matchCount += 2;
      } 
      // Partial match (contains) gets a point
      else if (lowerPoseKeyword.includes(lowerRequestedKeyword) || 
               lowerRequestedKeyword.includes(lowerPoseKeyword)) {
        matchCount += 1;
      }
    });
  });
  
  return matchCount;
}

/**
 * Selects poses for a session based on keywords, prioritizing poses with the most keyword matches
 */
export function getPosesForSession(
  allPoses: Pose[],
  keywords: string[],
  count: number,
  randomize: boolean = true
): Pose[] {
  // If no keywords provided, simply return random poses
  if (keywords.length === 0) {
    const poses = randomize ? shuffleArray([...allPoses]) : [...allPoses];
    return getRequiredPoseCount(poses, count);
  }
  
  // Score all poses based on keyword matches
  const scoredPoses: ScoredPose[] = allPoses
    .map(pose => ({
      pose,
      score: calculateKeywordMatchScore(pose, keywords)
    }))
    .filter(item => item.score > 0); // Only keep poses with at least one match
  
  // Sort poses by match score in descending order
  scoredPoses.sort((a, b) => b.score - a.score);
  
  // Extract just the poses from the scored array
  let filteredPoses = scoredPoses.map(item => item.pose);
  
  // If no poses match, use all available poses as a fallback
  if (filteredPoses.length === 0) {
    console.log("No keyword matches found, using all available poses");
    filteredPoses = allPoses;
    
    // Apply random order if requested
    if (randomize) {
      filteredPoses = shuffleArray([...filteredPoses]);
    }
  } else {
    console.log(`Found ${filteredPoses.length} poses with keyword matches, sorted by relevance`);
    
    // If randomize is specified, shuffle each score group separately to maintain relevance order
    // while providing variety within same-score groups
    if (randomize) {
      // Group poses by their scores
      const scoreGroups: { [score: number]: Pose[] } = {};
      scoredPoses.forEach(item => {
        if (!scoreGroups[item.score]) {
          scoreGroups[item.score] = [];
        }
        scoreGroups[item.score].push(item.pose);
      });
      
      // Shuffle each score group individually
      Object.keys(scoreGroups).forEach(scoreKey => {
        scoreGroups[parseInt(scoreKey)] = shuffleArray(scoreGroups[parseInt(scoreKey)]);
      });
      
      // Reconstruct the filtered poses array in score order but with randomized poses within each score
      filteredPoses = [];
      const scores = Object.keys(scoreGroups).map(Number).sort((a, b) => b - a);
      scores.forEach(score => {
        filteredPoses = [...filteredPoses, ...scoreGroups[score]];
      });
    }
  }
  
  // Get the required number of poses
  return getRequiredPoseCount(filteredPoses, count);
}

/**
 * Helper function to get the required number of poses, repeating as necessary
 */
function getRequiredPoseCount(poses: Pose[], count: number): Pose[] {
  let result: Pose[] = [];
  
  // Keep adding poses until we reach the desired count
  while (result.length < count) {
    result = [...result, ...poses].slice(0, count);
  }
  
  return result;
}
