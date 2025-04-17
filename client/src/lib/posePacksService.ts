import { apiRequest } from './queryClient';
import type { PosePack, Pose } from '@shared/schema';

export interface PosePackDetail {
  pack: PosePack;
  poses: Pose[];
}

// Fetch all pose packs
export async function fetchPosePacks(): Promise<PosePack[]> {
  const response = await apiRequest('/api/pose-packs');
  return response.json();
}

// Search for pose packs by query
export async function searchPosePacks(query: string): Promise<PosePack[]> {
  const response = await apiRequest(`/api/pose-packs/search?q=${encodeURIComponent(query)}`);
  return response.json();
}

// Fetch details of a specific pose pack
export async function fetchPosePackDetail(id: number): Promise<PosePackDetail> {
  const response = await apiRequest(`/api/pose-packs/${id}`);
  return response.json();
}

// Download a pose pack to add its poses to the user's library
export async function downloadPosePack(id: number): Promise<{success: boolean; message: string; poses: Pose[]}> {
  const response = await apiRequest(`/api/pose-packs/${id}/download`, {
    method: 'POST',
  });
  return response.json();
}