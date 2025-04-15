import { Pose } from '@/types';
import { apiRequest } from './queryClient';
import { queryClient } from './queryClient';

type PoseResponse = {
  pose: Pose;
  difficultyLevel: number;
  difficultyReason: string;
};

/**
 * Analyzes the difficulty of a pose using AI
 * @param poseId The ID of the pose to analyze
 * @returns The updated pose with difficulty information
 */
export async function analyzePoseDifficulty(poseId: number): Promise<Pose> {
  const response = await fetch(`/api/poses/${poseId}/analyze-difficulty`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to analyze pose difficulty');
  }
  
  const data = await response.json();
  
  // Invalidate the pose cache to ensure the latest data is fetched
  queryClient.invalidateQueries({ queryKey: ['/api/poses'] });
  
  return data.pose;
}

/**
 * Manually updates the difficulty of a pose
 * @param poseId The ID of the pose to update
 * @param difficultyLevel The difficulty level (1-Easy, 2-Medium, 3-Hard)
 * @param difficultyReason The reason for the difficulty classification
 * @returns The updated pose
 */
export async function updatePoseDifficulty(
  poseId: number, 
  difficultyLevel: number, 
  difficultyReason: string
): Promise<Pose> {
  const response = await fetch(`/api/poses/${poseId}/difficulty`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ difficultyLevel, difficultyReason })
  });
  
  if (!response.ok) {
    throw new Error('Failed to update pose difficulty');
  }
  
  const data = await response.json();
  
  // Invalidate the pose cache to ensure the latest data is fetched
  queryClient.invalidateQueries({ queryKey: ['/api/poses'] });
  
  return data.pose;
}

/**
 * Gets all poses with a specific difficulty level
 * @param difficultyLevel The difficulty level (1-Easy, 2-Medium, 3-Hard)
 * @returns A list of poses with the specified difficulty level
 */
export async function getPosesByDifficulty(difficultyLevel: number): Promise<Pose[]> {
  const response = await fetch(`/api/poses/difficulty/${difficultyLevel}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch poses by difficulty');
  }
  
  return await response.json();
}

/**
 * Converts a difficulty level number to a human-readable string
 * @param level The difficulty level (1-Easy, 2-Medium, 3-Hard)
 * @returns A string representation of the difficulty level
 */
export function getDifficultyLabel(level: number | undefined): string {
  switch(level) {
    case 1: return 'Easy';
    case 2: return 'Medium';
    case 3: return 'Hard';
    default: return 'Unknown';
  }
}

/**
 * Returns a CSS class based on the difficulty level
 * @param level The difficulty level (1-Easy, 2-Medium, 3-Hard)
 * @returns A CSS class for styling based on difficulty
 */
export function getDifficultyClass(level: number | undefined): string {
  switch(level) {
    case 1: return 'text-green-500 border-green-500';
    case 2: return 'text-orange-500 border-orange-500';
    case 3: return 'text-red-500 border-red-500';
    default: return 'text-gray-500 border-gray-500';
  }
}