"use client";

import { FormEvent, useEffect, useState } from "react";
import { createServer } from "@/lib/mcpServers";

const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL ?? "http://localhost:8000";

type AddServerModalProps = {
  open: boolean;
  onClose: () => void;
};

function toMessage(err: unknown): string {
  if (err instanceof TypeError) return "서버에 연결할 수 없습니다. 네트워크 연결을 확인해 주세요.";
  if (err instanceof Error) return err.message;
  return "알 수 없는 오류가 발생했습니다.";
}

export function AddServerModal({ open, onClose }: AddServerModalProps) {
  const [mode, setMode] = useState<"stdio" | "url">("stdio");
  const [name, setName] = useState("");
  const [command, setCommand] = useState("");
  const [args, setArgs] = useState("");
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const reset = () => {
    setName("");
    setCommand("");
    setArgs("");
    setUrl("");
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      if (mode === "url") {
        await createServer(AGENT_URL, { name: name.trim(), url: url.trim() });
      } else {
        await createServer(AGENT_URL, {
          name: name.trim(),
          command: command.trim(),
          args: args.trim() ? args.trim().split(/\s+/) : [],
        });
      }
      setSuccess(true);
      setTimeout(() => {
        reset();
        onClose();
      }, 1000);
    } catch (err) {
      setError(toMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-foreground">MCP 서버 추가</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-sm text-muted hover:text-accent"
          >
            닫기
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-3 rounded-xl border border-success-border bg-success-bg px-4 py-3 text-sm text-success">
            ✓ 추가되었습니다
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2 text-sm">
            <button
              type="button"
              onClick={() => setMode("stdio")}
              className={`rounded-full px-3 py-1 ${mode === "stdio" ? "bg-accent text-accent-foreground" : "text-muted"}`}
            >
              로컬(stdio)
            </button>
            <button
              type="button"
              onClick={() => setMode("url")}
              className={`rounded-full px-3 py-1 ${mode === "url" ? "bg-accent text-accent-foreground" : "text-muted"}`}
            >
              원격(url)
            </button>
          </div>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="서버 이름"
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
          />

          {mode === "stdio" ? (
            <>
              <input
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="실행 명령 (예: npx)"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
              />
              <input
                value={args}
                onChange={(e) => setArgs(e.target.value)}
                placeholder="인자 (공백 구분, 예: -y @modelcontextprotocol/server-filesystem C:\\Users)"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
              />
            </>
          ) : (
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="서버 URL (https://...)"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "추가 중..." : "서버 추가"}
          </button>
        </form>
      </div>
    </div>
  );
}
