from autogen_ext.tools.mcp import StdioServerParams

import config


def get_mcp_server_params() -> StdioServerParams:
    return StdioServerParams(
        command=config.MCP_SERVER_COMMAND,
        args=config.MCP_SERVER_ARGS,
        read_timeout_seconds=30,
    )
