import type { Conversation } from "./types";

const STORAGE_KEY = "mcp-assistant:conversations";

export function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Conversation[]) : [];
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]): void {
  if (typeof window === "undefined") return;
  try {
    const withTurns = conversations.filter((c) => c.turns.length > 0);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(withTurns));
  } catch {
    // 저장 실패(용량 초과 등)는 조용히 무시
  }
}
