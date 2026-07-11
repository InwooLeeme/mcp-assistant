import { useCallback, useEffect, useState } from "react";
import {
  createServer,
  deleteServer,
  fetchServers,
  type McpServer,
  type NewMcpServer,
} from "@/lib/mcpServers";

function toMessage(err: unknown): string {
  if (err instanceof TypeError) return "서버에 연결할 수 없습니다. 네트워크 연결을 확인해 주세요.";
  if (err instanceof Error) return err.message;
  return "알 수 없는 오류가 발생했습니다.";
}

export function useMcpServers(baseUrl: string) {
  const [servers, setServers] = useState<McpServer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setServers(await fetchServers(baseUrl));
    } catch (err) {
      setError(toMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const nextServers = await fetchServers(baseUrl);
        if (active) setServers(nextServers);
      } catch (err) {
        if (active) setError(toMessage(err));
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [baseUrl]);

  const add = useCallback(
    async (body: NewMcpServer) => {
      setError(null);
      try {
        await createServer(baseUrl, body);
        await refresh();
      } catch (err) {
        setError(toMessage(err));
      }
    },
    [baseUrl, refresh]
  );

  const remove = useCallback(
    async (name: string) => {
      setError(null);
      try {
        await deleteServer(baseUrl, name);
        await refresh();
      } catch (err) {
        setError(toMessage(err));
      }
    },
    [baseUrl, refresh]
  );

  return { servers, error, isLoading, refresh, add, remove };
}
