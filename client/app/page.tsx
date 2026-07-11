"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AddServerModal } from "@/components/AddServerModal";
import { CommandForm } from "@/components/CommandForm";
import { ConversationSidebar } from "@/components/ConversationSidebar";
import { ConversationTurn } from "@/components/ConversationTurn";
import { ProgressLog } from "@/components/ProgressLog";
import { ResultMessage } from "@/components/ResultMessage";
import { useCommandStream } from "@/hooks/useCommandStream";
import { useConversations } from "@/hooks/useConversations";

const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL ?? "http://localhost:8000";

const EXAMPLES = ["카카오톡 실행해 줘", "뉴스 페이지 열어줘", "카페 음악 재생해 줘"];
const CAPABILITIES = [
  {
    title: "앱 실행과 종료",
    description: "설치된 프로그램을 찾아 실행하고, 실행 중인 일반 프로그램을 종료합니다.",
  },
  {
    title: "웹과 유튜브",
    description: "https 페이지를 열고, 검색어로 유튜브 영상을 찾아 재생합니다.",
  },
  {
    title: "미디어 제어",
    description: "재생/일시정지, 다음/이전, 볼륨 조절, 음소거를 처리합니다.",
  },
  {
    title: "주요 폴더 열기",
    description: "다운로드, 문서, 바탕화면, 사진 폴더를 탐색기로 엽니다.",
  },
];

export default function Home() {
  const { stages, error, isLoading, submit, reset } = useCommandStream(AGENT_URL);
  const {
    conversations,
    activeConversation,
    activeId,
    newConversation,
    selectConversation,
    deleteConversation,
    appendTurn,
  } = useConversations();
  const [showAddServer, setShowAddServer] = useState(false);
  const [pendingCommand, setPendingCommand] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      if (!active) return;
      const stored = window.localStorage.getItem("mcp-assistant:sidebarOpen");
      if (stored !== null) setSidebarOpen(stored === "true");
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("mcp-assistant:sidebarOpen", String(sidebarOpen));
  }, [sidebarOpen]);

  const turns = activeConversation?.turns ?? [];

  const runCommand = async (text: string) => {
    const history = activeConversation?.turns ?? [];
    setPendingCommand(text);
    const finalResult = await submit(text, history);
    if (finalResult) {
      appendTurn({ command: text, status: finalResult.status, message: finalResult.message });
      reset();
    }
    setPendingCommand(null);
  };

  const handleNew = () => {
    reset();
    setPendingCommand(null);
    newConversation();
  };

  const handleSelect = (id: string) => {
    reset();
    setPendingCommand(null);
    selectConversation(id);
  };

  return (
    <main className="flex min-h-screen">
      <ConversationSidebar
        conversations={conversations}
        activeId={activeId}
        open={sidebarOpen}
        onSelect={handleSelect}
        onDelete={deleteConversation}
        onNew={handleNew}
      />

      <div className="relative flex flex-1 flex-col items-center px-4 py-10 sm:py-16">
        <button
          type="button"
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label={sidebarOpen ? "사이드바 닫기" : "사이드바 열기"}
          className="absolute left-4 top-4 rounded-lg border border-border bg-surface p-2 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
        >
          ☰
        </button>
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

          {turns.length > 0 || pendingCommand ? (
            <div className="mb-4 space-y-4">
              {turns.map((turn, index) => (
                <ConversationTurn key={index} turn={turn} />
              ))}
              {pendingCommand && (
                <div className="flex justify-end">
                  <p className="max-w-[85%] rounded-xl bg-accent px-4 py-2 text-sm text-accent-foreground">
                    {pendingCommand}
                  </p>
                </div>
              )}
            </div>
          ) : null}

          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
            <CommandForm onSubmit={runCommand} disabled={isLoading} />
            <ProgressLog stages={stages} />
            <ResultMessage result={null} error={error} />
          </div>

          <section className="mt-4 rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-foreground">현재 가능한 작업</h2>
              <p className="mt-1 text-xs text-muted">
                기본 로컬 MCP 서버 기준입니다. MCP 서버를 추가하면 가능한 범위가 확장됩니다.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {CAPABILITIES.map((capability) => (
                <div key={capability.title} className="rounded-xl border border-border bg-background px-3 py-2.5">
                  <p className="text-xs font-medium text-foreground">{capability.title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">{capability.description}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-muted">
              시스템 핵심 프로세스 종료와 로컬/사설 주소 원격 MCP 등록은 보안상 제한됩니다.
            </p>
          </section>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => !isLoading && runCommand(example)}
                disabled={isLoading}
                className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
              >
                {example}
              </button>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => setShowAddServer(true)}
              className="text-muted hover:text-accent"
            >
              + MCP 추가
            </button>
            <span className="text-border">·</span>
            <Link href="/servers" className="text-muted hover:text-accent">
              MCP 서버 관리 →
            </Link>
          </div>
        </div>
      </div>

      <AddServerModal open={showAddServer} onClose={() => setShowAddServer(false)} />
    </main>
  );
}
