import type { Host, ModelingSession } from "@shared/schema";

// Helper function to fetch JSON data from API
async function fetchJSON<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error (${response.status}): ${errorText}`);
  }
  
  return response.json() as Promise<T>;
}

// Host operations
export async function getAllHosts(): Promise<Host[]> {
  return fetchJSON<Host[]>("/api/hosts");
}

export async function getHost(id: number): Promise<Host> {
  return fetchJSON<Host>(`/api/hosts/${id}`);
}

export async function createHost(host: Partial<Host>): Promise<Host> {
  return fetchJSON<Host>("/api/hosts", {
    method: "POST",
    body: JSON.stringify(host),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function updateHost(id: number, host: Partial<Host>): Promise<Host> {
  return fetchJSON<Host>(`/api/hosts/${id}`, {
    method: "PUT",
    body: JSON.stringify(host),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function deleteHost(id: number): Promise<void> {
  await fetch(`/api/hosts/${id}`, {
    method: "DELETE",
    credentials: 'include',
  });
}

// Modeling session operations
export async function getAllModelingSessions(): Promise<ModelingSession[]> {
  return fetchJSON<ModelingSession[]>("/api/modeling-sessions");
}

export async function getModelingSession(id: number): Promise<ModelingSession> {
  return fetchJSON<ModelingSession>(`/api/modeling-sessions/${id}`);
}

export async function getModelingSessionsByHostId(hostId: number): Promise<ModelingSession[]> {
  return fetchJSON<ModelingSession[]>(`/api/hosts/${hostId}/modeling-sessions`);
}

export async function createModelingSession(session: Partial<ModelingSession>): Promise<ModelingSession> {
  return fetchJSON<ModelingSession>("/api/modeling-sessions", {
    method: "POST",
    body: JSON.stringify(session),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function updateModelingSession(id: number, session: Partial<ModelingSession>): Promise<ModelingSession> {
  return fetchJSON<ModelingSession>(`/api/modeling-sessions/${id}`, {
    method: "PUT",
    body: JSON.stringify(session),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function deleteModelingSession(id: number): Promise<void> {
  await fetch(`/api/modeling-sessions/${id}`, {
    method: "DELETE",
    credentials: 'include',
  });
}