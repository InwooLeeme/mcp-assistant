export type McpServer = {
  name: string;
  transport: "stdio" | "url";
  connected: boolean;
  tool_count: number;
  error: string | null;
};

export type NewMcpServer = {
  name: string;
  command?: string;
  args?: string[];
  url?: string;
};

export async function fetchServers(baseUrl: string): Promise<McpServer[]> {
  const res = await fetch(`${baseUrl}/mcp-servers`);
  if (!res.ok) throw new Error("서버 목록을 불러오지 못했습니다.");
  const data = (await res.json()) as { servers: McpServer[] };
  return data.servers;
}

export async function createServer(baseUrl: string, body: NewMcpServer): Promise<void> {
  const res = await fetch(`${baseUrl}/mcp-servers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.detail ?? "서버 추가에 실패했습니다.");
  }
}

export async function deleteServer(baseUrl: string, name: string): Promise<void> {
  const res = await fetch(`${baseUrl}/mcp-servers/${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("서버 삭제에 실패했습니다.");
}
