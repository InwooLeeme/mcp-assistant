import { useCallback, useEffect, useState } from "react";
import { loadConversations, saveConversations } from "@/lib/conversationStore";
import type { Conversation, HistoryTurn } from "@/lib/types";

function createConversation(): Conversation {
  return {
    id: crypto.randomUUID(),
    title: "새 대화",
    turns: [],
    updatedAt: Date.now(),
  };
}

function titleFromCommand(command: string): string {
  const trimmed = command.trim();
  return trimmed.length > 30 ? `${trimmed.slice(0, 30)}…` : trimmed;
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadConversations();
    if (loaded.length > 0) {
      setConversations(loaded);
      setActiveId(loaded[0].id);
    } else {
      const fresh = createConversation();
      setConversations([fresh]);
      setActiveId(fresh.id);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveConversations(conversations);
  }, [conversations, hydrated]);

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

  const newConversation = useCallback(() => {
    const existingEmpty = conversations.find((c) => c.turns.length === 0);
    if (existingEmpty) {
      setActiveId(existingEmpty.id);
      return;
    }
    const fresh = createConversation();
    setConversations((prev) => [fresh, ...prev]);
    setActiveId(fresh.id);
  }, [conversations]);

  const selectConversation = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      const next = conversations.filter((c) => c.id !== id);
      if (id === activeId) {
        if (next.length > 0) {
          setActiveId(next[0].id);
          setConversations(next);
        } else {
          const fresh = createConversation();
          setActiveId(fresh.id);
          setConversations([fresh]);
        }
      } else {
        setConversations(next);
      }
    },
    [conversations, activeId]
  );

  const appendTurn = useCallback(
    (turn: HistoryTurn) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== activeId) return c;
          const isFirst = c.turns.length === 0;
          return {
            ...c,
            title: isFirst ? titleFromCommand(turn.command) : c.title,
            turns: [...c.turns, turn],
            updatedAt: Date.now(),
          };
        })
      );
    },
    [activeId]
  );

  return {
    conversations,
    activeConversation,
    activeId,
    newConversation,
    selectConversation,
    deleteConversation,
    appendTurn,
  };
}
