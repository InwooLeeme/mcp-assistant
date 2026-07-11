import asyncio
import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

os.environ.setdefault("GEMINI_API_KEY", "test-key")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import main  # noqa: E402


class McpServerRouteTests(unittest.TestCase):
    def test_list_mcp_servers_does_not_connect_to_servers(self) -> None:
        class ExplodingWorkbench:
            def __init__(self, *args, **kwargs) -> None:
                raise AssertionError("list route must not connect to MCP servers")

        with (
            patch.object(
                main.mcp_config,
                "list_servers",
                return_value={"alpha": {"command": "python", "args": []}},
            ),
            patch.object(main, "McpWorkbench", ExplodingWorkbench),
        ):
            result = asyncio.run(main.list_mcp_servers())

        self.assertEqual(
            result,
            {
                "servers": [
                    {
                        "name": "alpha",
                        "transport": "stdio",
                        "checked": False,
                        "connected": False,
                        "tool_count": 0,
                        "error": None,
                    }
                ]
            },
        )

    def test_test_mcp_server_connects_to_one_server(self) -> None:
        class FakeWorkbench:
            def __init__(self, server_params) -> None:
                self.server_params = server_params

            async def __aenter__(self):
                return self

            async def __aexit__(self, exc_type, exc, tb) -> None:
                return None

            async def list_tools(self):
                return [{"name": "one"}, {"name": "two"}]

        with (
            patch.object(
                main.mcp_config,
                "list_servers",
                return_value={
                    "alpha": {"command": "python", "args": []},
                    "beta": {"url": "https://example.com/mcp"},
                },
            ),
            patch.object(main, "McpWorkbench", FakeWorkbench),
        ):
            result = asyncio.run(main.test_mcp_server("alpha"))

        self.assertEqual(
            result,
            {
                "name": "alpha",
                "transport": "stdio",
                "checked": True,
                "connected": True,
                "tool_count": 2,
                "error": None,
            },
        )


if __name__ == "__main__":
    unittest.main()
