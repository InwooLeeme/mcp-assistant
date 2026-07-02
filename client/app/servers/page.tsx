"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useMcpServers } from "@/hooks/useMcpServers";

const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL ?? "http://localhost:8000";

export default function ServersPage() {
  const { servers, error, isLoading, add, remove } = useMcpServers(AGENT_URL);
  const [mode, setMode] = useState<"stdio" | "url">("stdio");
  const [name, setName] = useState("");
  const [command, setCommand] = useState("");
  const [args, setArgs] = useState("");
  const [url, setUrl] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    if (mode === "url") {
      await add({ name: name.trim(), url: url.trim() });
    } else {
      await add({
        name: name.trim(),
        command: command.trim(),
        args: args.trim() ? args.trim().split(/\s+/) : [],
      });
    }
    setName("");
    setCommand("");
    setArgs("");
    setUrl("");
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl px-4 py-10 sm:py-16">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-foreground">MCP 서버 관리</h1>
        <Link href="/" className="text-sm text-muted hover:text-accent">
          ← 명령으로
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <ul className="mb-8 space-y-2">
        {servers.map((server) => (
          <li
            key={server.name}
            className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
          >
            <div>
              <p className="font-medium text-foreground">{server.name}</p>
              <p className="text-xs text-muted">
                {server.connected
                  ? `연결됨 · 도구 ${server.tool_count}개`
                  : `실패 · ${server.error ?? "연결 불가"}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => remove(server.name)}
              className="text-xs text-muted transition-colors hover:text-danger"
            >
              삭제
            </button>
          </li>
        ))}
        {!isLoading && servers.length === 0 && (
          <li className="text-sm text-muted">등록된 서버가 없습니다.</li>
        )}
      </ul>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-border bg-surface p-4">
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
          className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
        >
          서버 추가
        </button>
      </form>
    </main>
  );
}
