import type { CommandEvent, HistoryTurn } from "./types";

export async function* streamCommand(
  text: string,
  baseUrl: string,
  history: HistoryTurn[] = [],
  signal?: AbortSignal
): AsyncGenerator<CommandEvent, void, void> {
  const response = await fetch(`${baseUrl}/command`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, history }),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`서버 요청에 실패했습니다. (status: ${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const dataLine = part.split("\n").find((line) => line.startsWith("data:"));
      if (!dataLine) continue;

      const json = dataLine.slice("data:".length).trim();
      if (!json) continue;

      const event = JSON.parse(json) as CommandEvent;
      yield event;
      if (event.type === "result") return;
    }
  }
}
