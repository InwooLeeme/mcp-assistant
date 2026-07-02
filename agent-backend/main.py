import logging
import uuid

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

import config
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


@app.get("/health")
async def health() -> dict[str, str]:
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
