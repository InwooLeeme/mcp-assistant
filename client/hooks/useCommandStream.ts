import { useCallback, useState } from "react";
import { streamCommand } from "@/lib/sseClient";
import type { ResultEvent, StageEvent } from "@/lib/types";

type CommandStreamState = {
  stages: StageEvent[];
  result: ResultEvent | null;
  error: string | null;
  isLoading: boolean;
};

const INITIAL_STATE: CommandStreamState = {
  stages: [],
  result: null,
  error: null,
  isLoading: false,
};

export function useCommandStream(baseUrl: string) {
  const [state, setState] = useState<CommandStreamState>(INITIAL_STATE);

  const submit = useCallback(
    async (text: string) => {
      setState({ stages: [], result: null, error: null, isLoading: true });
      try {
        for await (const event of streamCommand(text, baseUrl)) {
          if (event.type === "stage") {
            setState((prev) => ({ ...prev, stages: [...prev.stages, event] }));
          } else {
            setState((prev) => ({ ...prev, result: event, isLoading: false }));
          }
        }
      } catch (err) {
        const message =
          err instanceof TypeError
            ? "서버에 연결할 수 없습니다. 네트워크 연결을 확인해 주세요."
            : err instanceof Error
              ? err.message
              : "알 수 없는 오류가 발생했습니다.";
        setState((prev) => ({ ...prev, error: message, isLoading: false }));
      }
    },
    [baseUrl]
  );

  return { ...state, submit };
}
