import logging
import uuid

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from autogen_ext.tools.mcp import McpWorkbench

import config
import mcp_config
from pipeline import run_command_pipeline
from sse import format_sse, result_event

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("agent-backend")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.CORS_ALLOW_ORIGIN],
    allow_methods=["*"],
    allow_headers=["*"],
)


class CommandRequest(BaseModel):
    text: str


class ServerCreateRequest(BaseModel):
    name: str
    command: str | None = None
    args: list[str] = []
    env: dict[str, str] | None = None
    url: str | None = None


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


def _entry_transport(entry: dict) -> str:
    return "url" if "url" in entry else "stdio"


@app.get("/mcp-servers")
async def list_mcp_servers() -> dict:
    servers = []
    for name, entry in mcp_config.list_servers().items():
        item = {
            "name": name,
            "transport": _entry_transport(entry),
            "connected": False,
            "tool_count": 0,
            "error": None,
        }
        try:
            params = mcp_config.to_server_params(entry)
            async with McpWorkbench(server_params=params) as wb:
                tools = await wb.list_tools()
            item["connected"] = True
            item["tool_count"] = len(tools)
        except Exception as exc:
            item["error"] = str(exc)
        servers.append(item)
    return {"servers": servers}


@app.post("/mcp-servers")
async def add_mcp_server(body: ServerCreateRequest) -> dict:
    entry: dict = {}
    if body.url:
        entry["url"] = body.url
    elif body.command:
        entry["command"] = body.command
        entry["args"] = body.args
        if body.env:
            entry["env"] = body.env
    try:
        mcp_config.add_server(body.name, entry)
    except mcp_config.ConfigError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"status": "ok"}


@app.delete("/mcp-servers/{name}")
async def delete_mcp_server(name: str) -> dict:
    try:
        mcp_config.remove_server(name)
    except mcp_config.ConfigError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return {"status": "ok"}


@app.post("/command")
async def command(body: CommandRequest) -> StreamingResponse:
    request_id = str(uuid.uuid4())

    async def event_stream():
        logger.info("[%s] 명령 수신: %s", request_id, body.text)
        try:
            async for event in run_command_pipeline(body.text):
                logger.info("[%s] 이벤트: %s", request_id, event)
                yield format_sse(event)
        except Exception:
            logger.exception("[%s] 파이프라인 처리 실패", request_id)
            yield format_sse(
                result_event("fail", "명령 처리 중 오류가 발생했습니다.", {})
            )

    return StreamingResponse(event_stream(), media_type="text/event-stream")
