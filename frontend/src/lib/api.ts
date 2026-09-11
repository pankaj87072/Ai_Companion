import type { AppUser, ChatMessage, ChatResponse, Companion, Memory } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new ApiError(
      "We couldn't reach the server. Check your connection and try again.",
      0
    );
  }

  if (!res.ok) {
    let detail = "Something went wrong. Please try again in a moment.";
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      // ignore parse errors, use default message
    }
    throw new ApiError(detail, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  health: () => request<{ status: string }>("/health"),

  getCompanions: () => request<Companion[]>("/companions"),

  createGuestUser: (companion_id: string, companion_name: string) =>
    request<AppUser>("/users/guest", {
      method: "POST",
      body: JSON.stringify({ companion_id, companion_name }),
    }),

  sendMessage: (user_id: string, message: string) =>
    request<ChatResponse>("/chat", {
      method: "POST",
      body: JSON.stringify({ user_id, message }),
    }),

  getConversation: (user_id: string) =>
    request<ChatMessage[]>(`/conversations/${user_id}`),

  getMemories: (user_id: string) => request<Memory[]>(`/memories/${user_id}`),

  deleteMemory: (memory_id: string) =>
    request<{ status: string }>(`/memories/${memory_id}`, { method: "DELETE" }),

  forgetAllMemories: (user_id: string) =>
    request<{ status: string }>(`/memories/user/${user_id}`, { method: "DELETE" }),
};
