import json


def stage_event(stage: str, message: str) -> dict:
    return {"type": "stage", "stage": stage, "message": message}


def result_event(status: str, message: str, detail: dict) -> dict:
    return {"type": "result", "status": status, "message": message, "detail": detail}


def format_sse(event: dict) -> str:
    return f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
