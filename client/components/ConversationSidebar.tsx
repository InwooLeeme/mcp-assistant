"use client";

import type { Conversation } from "@/lib/types";

type ConversationSidebarProps = {
  conversations: Conversation[];
  activeId: string | null;
  open: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
};

function formatUpdatedAt(updatedAt: number): string {
  const date = new Date(updatedAt);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();

  if (sameDay) {
    return new Intl.DateTimeFormat("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function ConversationSidebar({
  conversations,
  activeId,
  open,
  onSelect,
  onDelete,
  onNew,
}: ConversationSidebarProps) {
  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <aside
      className={`flex shrink-0 flex-col overflow-hidden bg-surface/95 shadow-sm transition-[width] duration-300 ease-in-out ${
        open ? "w-72 border-r border-border" : "w-0 border-r-0"
      }`}
    >
      <div className="border-b border-border px-4 py-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">History</p>
            <h2 className="mt-1 font-serif text-lg font-bold text-foreground">대화 기록</h2>
          </div>
          <span className="rounded-full border border-border bg-background px-2 py-1 text-xs text-muted">
            {sorted.length}개
          </span>
        </div>
        <button
          type="button"
          onClick={onNew}
          className="w-full rounded-xl bg-accent px-3 py-2.5 text-sm font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent-hover"
        >
          + 새 대화
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {sorted.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-background px-4 py-6 text-center">
            <p className="text-sm font-medium text-foreground">아직 대화가 없습니다.</p>
            <p className="mt-2 text-xs leading-5 text-muted">
              명령을 실행하면 이곳에 대화 기록이 시간순으로 정리됩니다.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {sorted.map((c) => (
              <li key={c.id}>
                <div
                  className={`group relative rounded-2xl border px-3 py-3 text-sm transition-colors ${
                    c.id === activeId
                      ? "border-accent/40 bg-accent/10 text-accent shadow-sm"
                      : "border-transparent text-muted hover:border-border hover:bg-background"
                  }`}
                >
                  {c.id === activeId && (
                    <span className="absolute left-0 top-3 h-8 w-1 rounded-r-full bg-accent" />
                  )}
                  <div className="flex items-start gap-2 pl-1">
                    <button
                      type="button"
                      onClick={() => onSelect(c.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="block truncate font-medium text-foreground">{c.title}</span>
                      <span className="mt-1 block text-xs text-muted">
                        {c.turns.length}개 메시지 · {formatUpdatedAt(c.updatedAt)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(c.id)}
                      aria-label="대화 삭제"
                      className="shrink-0 rounded-lg px-2 py-1 text-muted opacity-0 transition-opacity hover:bg-danger-bg hover:text-danger group-hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
