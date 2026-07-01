"use client";

import { CommandForm } from "@/components/CommandForm";
import { ProgressLog } from "@/components/ProgressLog";
import { ResultMessage } from "@/components/ResultMessage";
import { useCommandStream } from "@/hooks/useCommandStream";

const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL ?? "http://localhost:8000";

export default function Home() {
  const { stages, result, error, isLoading, submit } = useCommandStream(AGENT_URL);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">개인 텍스트 비서</h1>
      <CommandForm onSubmit={submit} disabled={isLoading} />
      <ProgressLog stages={stages} />
      <ResultMessage result={result} error={error} />
    </main>
  );
}
