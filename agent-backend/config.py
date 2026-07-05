import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent

load_dotenv(BASE_DIR / ".env")

GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
PLANNER_MODEL = os.getenv("PLANNER_MODEL", GEMINI_MODEL)
EXECUTOR_MODEL = os.getenv("EXECUTOR_MODEL", GEMINI_MODEL)
SELECTOR_MODEL = os.getenv("SELECTOR_MODEL", GEMINI_MODEL)
GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"

AGENT_PORT = int(os.getenv("AGENT_PORT", "8000"))
CORS_ALLOW_ORIGIN = os.getenv("CORS_ALLOW_ORIGIN", "http://localhost:3000")
