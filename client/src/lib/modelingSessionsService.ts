import { apiRequest, queryClient } from "../lib/queryClient";
import type { Host, ModelingSession } from "@shared/schema";

// Host operations
export async function getAllHosts(): Promise<Host[]> {
  return apiRequest({ url: "/api/hosts" });
}

export async function getHost(id: number): Promise<Host> {
  return apiRequest({ url: `/api/hosts/${id}` });
}

export async function createHost(host: Omit<Host, "id" | "createdAt" | "updatedAt">): Promise<Host> {
  return apiRequest({
    url: "/api/hosts",
    method: "POST",
    data: host
  });
}

export async function updateHost(id: number, host: Partial<Omit<Host, "id" | "createdAt" | "updatedAt">>): Promise<Host> {
  return apiRequest({
    url: `/api/hosts/${id}`,
    method: "PUT",
    data: host
  });
}

export async function deleteHost(id: number): Promise<void> {
  return apiRequest({
    url: `/api/hosts/${id}`,
    method: "DELETE"
  });
}

// Modeling session operations
export async function getAllModelingSessions(): Promise<ModelingSession[]> {
  return apiRequest({ url: "/api/modeling-sessions" });
}

export async function getModelingSession(id: number): Promise<ModelingSession> {
  return apiRequest({ url: `/api/modeling-sessions/${id}` });
}

export async function getModelingSessionsByHostId(hostId: number): Promise<ModelingSession[]> {
  return apiRequest({ url: `/api/hosts/${hostId}/modeling-sessions` });
}

export async function createModelingSession(
  session: Omit<ModelingSession, "id" | "createdAt" | "updatedAt">
): Promise<ModelingSession> {
  return apiRequest({
    url: "/api/modeling-sessions",
    method: "POST",
    data: session
  });
}

export async function updateModelingSession(
  id: number, 
  session: Partial<Omit<ModelingSession, "id" | "createdAt" | "updatedAt">>
): Promise<ModelingSession> {
  return apiRequest({
    url: `/api/modeling-sessions/${id}`,
    method: "PUT",
    data: session
  });
}

export async function deleteModelingSession(id: number): Promise<void> {
  return apiRequest({
    url: `/api/modeling-sessions/${id}`,
    method: "DELETE"
  });
}