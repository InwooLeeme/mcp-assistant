import ipaddress
import json
import os
import shutil
import socket
import sys
from pathlib import Path
from urllib.parse import urlparse

import config
from autogen_ext.tools.mcp import (
    McpServerParams,
    StdioServerParams,
    StreamableHttpServerParams,
)

BUNDLED_SERVER_KEY = "bundled"


class ConfigError(Exception):
    pass


def _bundled_config_path() -> Path:
    return config.BASE_DIR / "mcp_servers.json"


def _config_path() -> Path:
    if not getattr(sys, "frozen", False):
        return _bundled_config_path()
    appdata = os.getenv("APPDATA")
    if not appdata:
        raise ConfigError("APPDATA 환경변수를 찾을 수 없습니다.")
    return Path(appdata) / "mcp-assistant" / "mcp_servers.json"


def _ensure_config_path() -> Path:
    path = _config_path()
    if not getattr(sys, "frozen", False) or path.exists():
        return path

    bundled_path = _bundled_config_path()
    if not bundled_path.is_file():
        raise ConfigError("번들 MCP 설정 파일을 찾을 수 없습니다.")
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(bundled_path, path)
    except OSError as exc:
        raise ConfigError(f"MCP 설정 파일을 초기화할 수 없습니다: {exc}") from exc
    return path


def _validate_remote_url(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme != "https":
        raise ConfigError("url은 https만 허용됩니다.")
    host = parsed.hostname
    if not host:
        raise ConfigError("url에서 호스트를 확인할 수 없습니다.")
    try:
        infos = socket.getaddrinfo(host, None)
    except socket.gaierror:
        raise ConfigError("url 호스트를 해석할 수 없습니다.")
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if ip.is_loopback or ip.is_private or ip.is_link_local or ip.is_reserved:
            raise ConfigError("사설/로컬 주소를 가리키는 url은 등록할 수 없습니다.")


def _resolve_bundled_entry() -> dict:
    if not getattr(sys, "frozen", False):
        server_path = (config.BASE_DIR.parent / "mcp-server" / "server.py").resolve()
        venv_python = (
            config.BASE_DIR.parent
            / "mcp-server"
            / ".venv"
            / "Scripts"
            / "python.exe"
        ).resolve()
        command = str(venv_python) if venv_python.exists() else "python"
        return {"command": command, "args": [str(server_path)]}

    exe_dir = Path(sys.executable).resolve().parent
    mcp_exe = (exe_dir / ".." / "mcp-server" / "mcp-server.exe").resolve()
    return {"command": str(mcp_exe), "args": []}


def _resolve_entry(entry: dict) -> dict:
    if entry.get(BUNDLED_SERVER_KEY) is True:
        return _resolve_bundled_entry()
    return entry


def _read() -> dict:
    path = _ensure_config_path()
    if not path.exists():
        return {"mcpServers": {}}
    with path.open(encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, dict):
        return {"mcpServers": {}}

    return data


def _write(data: dict) -> None:
    path = _ensure_config_path()
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def list_servers() -> dict[str, dict]:
    servers = _read().get("mcpServers", {})
    return {
        name: _resolve_entry(entry) if isinstance(entry, dict) else entry
        for name, entry in servers.items()
    }


def to_server_params(entry: dict) -> McpServerParams:
    entry = _resolve_entry(entry)
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
    if "url" in entry:
        _validate_remote_url(entry["url"])
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
