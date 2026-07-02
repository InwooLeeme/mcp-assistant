"use client";

import Link from "next/link";
import { CommandForm } from "@/components/CommandForm";
import { ProgressLog } from "@/components/ProgressLog";
import { ResultMessage } from "@/components/ResultMessage";
import { useCommandStream } from "@/hooks/useCommandStream";

const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL ?? "http://localhost:8000";

const EXAMPLES = ["카카오톡 실행해 줘", "뉴스 페이지 열어줘", "카페 음악 재생해 줘"];

export default function Home() {
  const { stages, result, error, isLoading, submit } = useCommandStream(AGENT_URL);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-xl">
        <header className="mb-6 text-center sm:mb-8">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            MCP Assistant
          </span>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            개인 텍스트 비서
          </h1>
          <p className="mt-3 text-sm text-muted sm:text-base">
            무엇을 도와드릴까요? 프로그램 실행부터 음악 재생까지, 말씀만 하세요.
          </p>
        </header>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
          <CommandForm onSubmit={submit} disabled={isLoading} />
          <ProgressLog stages={stages} />
          <ResultMessage result={result} error={error} />
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => !isLoading && submit(example)}
              disabled={isLoading}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
            >
              {example}
            </button>
          ))}
        </div>

        <div className="mt-6 text-center">
          <Link href="/servers" className="text-xs text-muted hover:text-accent">
            MCP 서버 관리 →
          </Link>
        </div>
      </div>
    </main>
  );
}
