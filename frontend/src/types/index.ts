export interface Companion {
  id: string;
  name: string;
  species: string;
  traits: string[];
  quote: string;
  accent: string;
}

export interface AppUser {
  id: string;
  companion_id: string | null;
  companion_name: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ChatResponse {
  reply: string;
  memories_saved: string[];
}

export interface Memory {
  id: string;
  content: string;
  category:
    | "fact"
    | "preference"
    | "goal"
    | "relationship"
    | "life_event"
    | "emotional_context";
  importance: number;
  created_at: string;
}

export type CompanionActivity = "idle" | "listening" | "thinking" | "speaking";

export type CompanionEmotion =
  | "neutral"
  | "happy"
  | "excited"
  | "calm"
  | "comforting"
  | "concerned";
