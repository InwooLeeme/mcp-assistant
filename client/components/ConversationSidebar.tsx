"use client";

import type { Conversation } from "@/lib/types";

type ConversationSidebarProps = {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
};

export function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onDelete,
  onNew,
}: ConversationSidebarProps) {
  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-surface">
      <div className="p-3">
        <button
          type="button"
          onClick={onNew}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
        >
          + 새 대화
        </button>
      </div>
      <ul className="flex-1 space-y-1 overflow-y-auto px-2 pb-3">
        {sorted.map((c) => (
          <li key={c.id}>
            <div
              className={`group flex items-center gap-1 rounded-lg px-2 py-2 text-sm transition-colors ${
                c.id === activeId
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:bg-background"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                className="flex-1 truncate text-left"
              >
                {c.title}
              </button>
              <button
                type="button"
                onClick={() => onDelete(c.id)}
                aria-label="대화 삭제"
                className="shrink-0 rounded px-1 text-muted opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
              >
                ×
              </button>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
