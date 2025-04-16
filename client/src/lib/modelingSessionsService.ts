import { apiRequest } from "./queryClient";
import type { Host, ModelingSession } from "@shared/schema";

// Host operations
export async function getAllHosts(): Promise<Host[]> {
  return apiRequest("/api/hosts");
}

export async function getHost(id: number): Promise<Host> {
  return apiRequest(`/api/hosts/${id}`);
}

export async function createHost(host: Partial<Host>): Promise<Host> {
  return apiRequest("/api/hosts", {
    method: "POST",
    body: JSON.stringify(host),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function updateHost(id: number, host: Partial<Host>): Promise<Host> {
  return apiRequest(`/api/hosts/${id}`, {
    method: "PUT",
    body: JSON.stringify(host),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function deleteHost(id: number): Promise<void> {
  return apiRequest(`/api/hosts/${id}`, {
    method: "DELETE",
  });
}

// Modeling session operations
export async function getAllModelingSessions(): Promise<ModelingSession[]> {
  return apiRequest("/api/modeling-sessions");
}

export async function getModelingSession(id: number): Promise<ModelingSession> {
  return apiRequest(`/api/modeling-sessions/${id}`);
}

export async function getModelingSessionsByHostId(hostId: number): Promise<ModelingSession[]> {
  return apiRequest(`/api/hosts/${hostId}/modeling-sessions`);
}

export async function createModelingSession(session: Partial<ModelingSession>): Promise<ModelingSession> {
  return apiRequest("/api/modeling-sessions", {
    method: "POST",
    body: JSON.stringify(session),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function updateModelingSession(id: number, session: Partial<ModelingSession>): Promise<ModelingSession> {
  return apiRequest(`/api/modeling-sessions/${id}`, {
    method: "PUT",
    body: JSON.stringify(session),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function deleteModelingSession(id: number): Promise<void> {
  return apiRequest(`/api/modeling-sessions/${id}`, {
    method: "DELETE",
  });
}