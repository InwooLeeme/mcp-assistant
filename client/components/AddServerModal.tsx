"use client";

import { FormEvent, useEffect, useState } from "react";
import { createServer, type NewMcpServer } from "@/lib/mcpServers";

const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL ?? "http://localhost:8000";

const PLACEHOLDER = `{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:\\\\Users"]
    }
  }
}`;

type AddServerModalProps = {
  open: boolean;
  onClose: () => void;
};

function toMessage(err: unknown): string {
  if (err instanceof TypeError) return "서버에 연결할 수 없습니다. 네트워크 연결을 확인해 주세요.";
  if (err instanceof Error) return err.message;
  return "알 수 없는 오류가 발생했습니다.";
}

function parseServers(raw: string): NewMcpServer[] {
  const data = JSON.parse(raw) as Record<string, unknown>;
  const container = data?.mcpServers;
  if (container && typeof container === "object") {
    return Object.entries(container as Record<string, NewMcpServer>).map(
      ([name, entry]) => ({ ...entry, name })
    );
  }
  if (typeof data?.name === "string") {
    return [data as unknown as NewMcpServer];
  }
  throw new Error('mcpServers 객체 또는 name을 가진 단일 서버 JSON을 입력하세요.');
}

export function AddServerModal({ open, onClose }: AddServerModalProps) {
  const [json, setJson] = useState("");
  const [pending, setPending] = useState<NewMcpServer[] | null>(null);
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
    setJson("");
    setPending(null);
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const commit = async (servers: NewMcpServer[]) => {
    setSubmitting(true);
    setError(null);
    try {
      for (const server of servers) {
        await createServer(AGENT_URL, server);
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    let servers: NewMcpServer[];
    try {
      servers = parseServers(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "JSON 형식이 올바르지 않습니다.");
      return;
    }
    if (servers.length === 0) {
      setError("추가할 서버가 없습니다.");
      return;
    }

    const commandServers = servers.filter((s) => s.command);
    if (commandServers.length > 0) {
      setError(null);
      setPending(servers);
      return;
    }
    await commit(servers);
  };

  const commandLines = (pending ?? [])
    .filter((s) => s.command)
    .map((s) => `${s.name}: ${s.command} ${(s.args ?? []).join(" ")}`.trim());

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

        {pending ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger">
              <p className="font-medium">이 서버는 로컬에서 명령을 실행합니다.</p>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                {commandLines.map((line) => (
                  <li key={line} className="break-all font-mono text-xs">
                    {line}
                  </li>
                ))}
              </ul>
              <p className="mt-2">등록을 허용하시겠어요?</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPending(null)}
                className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm text-muted hover:border-accent hover:text-accent"
              >
                취소
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => commit(pending)}
                className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
              >
                {submitting ? "추가 중..." : "허용하고 추가"}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={json}
              onChange={(e) => setJson(e.target.value)}
              placeholder={PLACEHOLDER}
              rows={10}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 font-mono text-xs outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "추가 중..." : "서버 추가"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
