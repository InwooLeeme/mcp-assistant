import json
import sys
from pathlib import Path

from autogen_ext.tools.mcp import (
    McpServerParams,
    StdioServerParams,
    StreamableHttpServerParams,
)

CONFIG_PATH = Path(__file__).resolve().parent / "mcp_servers.json"
LOCAL_SERVER_NAME = "local"


class ConfigError(Exception):
    pass


def _resolve_local_entry() -> dict:
    exe_dir = Path(sys.executable).resolve().parent
    mcp_exe = (exe_dir / ".." / "mcp-server" / "mcp-server.exe").resolve()
    return {"command": str(mcp_exe), "args": []}


def _read() -> dict:
    if not CONFIG_PATH.exists():
        return {"mcpServers": {}}
    with CONFIG_PATH.open(encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, dict):
        return {"mcpServers": {}}

    servers = data.get("mcpServers", {})
    if getattr(sys, "frozen", False) and LOCAL_SERVER_NAME in servers:
        servers[LOCAL_SERVER_NAME] = _resolve_local_entry()

    return data


def _write(data: dict) -> None:
    with CONFIG_PATH.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def list_servers() -> dict[str, dict]:
    return _read().get("mcpServers", {})


def to_server_params(entry: dict) -> McpServerParams:
    if "url" in entry:
        return StreamableHttpServerParams(url=entry["url"], headers=entry.get("headers"))
    if "command" in entry:
        return StdioServerParams(
            command=entry["command"],
            args=list(entry.get("args", [])),
            env=entry.get("env"),
            read_timeout_seconds=30,
        )
    raise ConfigError("MCP 서버 항목에는 'command' 또는 'url' 중 하나가 필요합니다.")


def add_server(name: str, entry: dict) -> None:
    if not name:
        raise ConfigError("서버 이름이 필요합니다.")
    to_server_params(entry)
    data = _read()
    servers = data.setdefault("mcpServers", {})
    if name in servers:
        raise ConfigError(f"이미 '{name}' 서버가 등록되어 있습니다.")
    servers[name] = entry
    _write(data)


def remove_server(name: str) -> None:
    data = _read()
    servers = data.get("mcpServers", {})
    if name not in servers:
        raise ConfigError(f"'{name}' 서버를 찾을 수 없습니다.")
    del servers[name]
    _write(data)
