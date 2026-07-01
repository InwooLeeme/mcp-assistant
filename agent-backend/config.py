import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent

GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"

AGENT_PORT = int(os.getenv("AGENT_PORT", "8000"))
CORS_ALLOW_ORIGIN = os.getenv("CORS_ALLOW_ORIGIN", "http://localhost:3000")

MCP_SERVER_COMMAND = os.getenv("MCP_SERVER_COMMAND", "python")
MCP_SERVER_ARGS = os.getenv(
    "MCP_SERVER_ARGS", str(BASE_DIR / "scripts" / "dev_stub_mcp_server.py")
).split()
