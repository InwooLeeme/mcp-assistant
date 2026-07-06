import asyncio
import logging
from contextlib import AsyncExitStack

from autogen_ext.tools.mcp import McpWorkbench

import mcp_config

logger = logging.getLogger("agent-backend")


class McpPool:
    def __init__(self) -> None:
        self._stack: AsyncExitStack | None = None
        self._tools: list[dict] | None = None
        self._router: dict[str, McpWorkbench] | None = None
        self._lock = asyncio.Lock()

    async def _connect(self) -> None:
        stack = AsyncExitStack()
        router: dict[str, McpWorkbench] = {}
        tools: list[dict] = []
        for name, entry in mcp_config.list_servers().items():
            try:
                params = mcp_config.to_server_params(entry)
                workbench = await stack.enter_async_context(
                    McpWorkbench(server_params=params)
                )
                for tool in await workbench.list_tools():
                    router[tool["name"]] = workbench
                    tools.append(tool)
            except Exception:
                logger.warning("MCP 서버 '%s' 연결 실패, 건너뜁니다.", name, exc_info=True)
        self._stack, self._tools, self._router = stack, tools, router

    async def acquire(self) -> tuple[list[dict], dict[str, McpWorkbench]]:
        async with self._lock:
            if self._stack is None:
                await self._connect()
            return self._tools, self._router

    async def invalidate(self) -> None:
        async with self._lock:
            if self._stack is not None:
                await self._stack.aclose()
            self._stack = None
            self._tools = None
            self._router = None

    async def aclose(self) -> None:
        await self.invalidate()
