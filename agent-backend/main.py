from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import config

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.CORS_ALLOW_ORIGIN],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
