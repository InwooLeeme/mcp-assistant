import type { HistoryTurn } from "@/lib/types";

type ConversationTurnProps = {
  turn: HistoryTurn;
};

export function ConversationTurn({ turn }: ConversationTurnProps) {
  const isSuccess = turn.status === "success";
  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-xl bg-accent px-4 py-2 text-sm text-accent-foreground">
          {turn.command}
        </p>
      </div>
      <div
        className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
          isSuccess
            ? "border-success-border bg-success-bg text-success"
            : "border-danger-border bg-danger-bg text-danger"
        }`}
      >
        <span aria-hidden className="mt-px">
          {isSuccess ? "✓" : "⚠"}
        </span>
        <p>{turn.message}</p>
      </div>
    </div>
  );
}
