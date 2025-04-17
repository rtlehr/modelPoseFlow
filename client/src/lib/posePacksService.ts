import { apiRequest } from "./queryClient";
import type { Pose, PosePack } from "@shared/schema";

export interface PosePackDetail {
  pack: PosePack;
  poses: Pose[];
}

export async function fetchPosePacks(): Promise<PosePack[]> {
  return apiRequest<PosePack[]>('/api/pose-packs');
}

export async function searchPosePacks(query: string): Promise<PosePack[]> {
  return apiRequest<PosePack[]>(`/api/pose-packs/search?query=${encodeURIComponent(query)}`);
}

export async function fetchPosePackDetail(id: number): Promise<PosePackDetail> {
  return apiRequest<PosePackDetail>(`/api/pose-packs/${id}`);
}

export async function downloadPosePack(id: number): Promise<{success: boolean; message: string; poses: Pose[]}> {
  return apiRequest<{success: boolean; message: string; poses: Pose[]}>(`/api/pose-packs/${id}/download`, {
    method: 'POST'
  });
}