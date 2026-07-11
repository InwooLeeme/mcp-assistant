import logging
import secrets
import uuid
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from autogen_ext.tools.mcp import McpWorkbench

import config
import mcp_config
from llm_client import get_model_client
from mcp_pool import McpPool
from pipeline import run_command_pipeline, HistoryTurn
from sse import format_sse, result_event

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("agent-backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.pool = McpPool()
    app.state.llm = get_model_client(config.PLANNER_MODEL)
    try:
        yield
    finally:
        await app.state.pool.aclose()
        await app.state.llm.close()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.CORS_ALLOW_ORIGIN],
    allow_methods=["*"],
    allow_headers=["*"],
)


async def require_auth(authorization: str | None = Header(default=None)) -> None:
    if not config.AGENT_TOKEN:
        raise HTTPException(status_code=503, detail="서버 인증이 구성되지 않았습니다.")
    expected = f"Bearer {config.AGENT_TOKEN}"
    if authorization is None or not secrets.compare_digest(authorization, expected):
        raise HTTPException(status_code=401, detail="인증에 실패했습니다.")


class CommandRequest(BaseModel):
    text: str
    history: list[HistoryTurn] = []


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


def _server_item(name: str, entry: dict, checked: bool = False) -> dict:
    return {
        "name": name,
        "transport": _entry_transport(entry),
        "checked": checked,
        "connected": False,
        "tool_count": 0,
        "error": None,
    }


async def _check_mcp_server(name: str, entry: dict) -> dict:
    item = _server_item(name, entry, checked=True)
    try:
        params = mcp_config.to_server_params(entry)
        async with McpWorkbench(server_params=params) as wb:
            tools = await wb.list_tools()
        item["connected"] = True
        item["tool_count"] = len(tools)
    except Exception:
        logger.warning("MCP 서버 '%s' 상태 확인 실패", name, exc_info=True)
        item["error"] = "연결에 실패했습니다."
    return item


def _server_entry_from_request(body: ServerCreateRequest) -> dict:
    if body.url:
        return {"url": body.url}

    entry: dict = {}
    if body.command:
        entry["command"] = body.command
        entry["args"] = body.args
        if body.env:
            entry["env"] = body.env
    return entry


@app.get("/mcp-servers", dependencies=[Depends(require_auth)])
async def list_mcp_servers() -> dict:
    return {
        "servers": [
            _server_item(name, entry)
            for name, entry in mcp_config.list_servers().items()
        ]
    }


@app.post("/mcp-servers/{name}/test", dependencies=[Depends(require_auth)])
async def test_mcp_server(name: str) -> dict:
    servers = mcp_config.list_servers()
    entry = servers.get(name)
    if entry is None:
        raise HTTPException(status_code=404, detail="서버를 찾을 수 없습니다.")
    return await _check_mcp_server(name, entry)


@app.post("/mcp-servers", dependencies=[Depends(require_auth)])
async def add_mcp_server(body: ServerCreateRequest) -> dict:
    entry = _server_entry_from_request(body)
    try:
        mcp_config.add_server(body.name, entry)
    except mcp_config.ConfigError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    await app.state.pool.invalidate()
    return {"status": "ok"}


@app.delete("/mcp-servers/{name}", dependencies=[Depends(require_auth)])
async def delete_mcp_server(name: str) -> dict:
    try:
        mcp_config.remove_server(name)
    except mcp_config.ConfigError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    await app.state.pool.invalidate()
    return {"status": "ok"}


@app.post("/command", dependencies=[Depends(require_auth)])
async def command(body: CommandRequest, request: Request) -> StreamingResponse:
    request_id = str(uuid.uuid4())
    tools, router = await request.app.state.pool.acquire()
    llm = request.app.state.llm

    async def event_stream():
        logger.info("[%s] 명령 수신: %s", request_id, body.text)
        try:
            async for event in run_command_pipeline(
                body.text, body.history, tools, router, llm
            ):
                logger.info("[%s] 이벤트: %s", request_id, event)
                yield format_sse(event)
        except Exception:
            logger.exception("[%s] 파이프라인 처리 실패", request_id)
            yield format_sse(
                result_event("fail", "명령 처리 중 오류가 발생했습니다.", {})
            )

    return StreamingResponse(event_stream(), media_type="text/event-stream")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=config.AGENT_PORT)
