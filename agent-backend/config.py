import os
import sys
from pathlib import Path

from dotenv import load_dotenv

if getattr(sys, "frozen", False):
    BASE_DIR = Path(sys.executable).resolve().parent
else:
    BASE_DIR = Path(__file__).resolve().parent

load_dotenv(BASE_DIR / ".env")

GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
PLANNER_MODEL = os.getenv("PLANNER_MODEL", GEMINI_MODEL)
GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"

AGENT_PORT = int(os.getenv("AGENT_PORT", "8000"))
CORS_ALLOW_ORIGIN = os.getenv("CORS_ALLOW_ORIGIN", "http://localhost:3000")
AGENT_TOKEN = os.getenv("AGENT_TOKEN")
