function getToken(): string {
  if (typeof window !== "undefined") {
    const injected = (window as unknown as { __AGENT_TOKEN__?: string }).__AGENT_TOKEN__;
    if (injected) return injected;
  }
  return process.env.NEXT_PUBLIC_AGENT_TOKEN ?? "";
}

export function agentHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}
