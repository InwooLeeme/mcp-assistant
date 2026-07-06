import json
from typing import AsyncGenerator

from autogen_ext.tools.mcp import McpWorkbench
from pydantic import BaseModel

from agents import build_planner_agent
from sse import result_event, stage_event

STAGE_MESSAGES = {
    "intent_analysis": "의도를 분석하고 있습니다...",
    "planning": "계획을 세우고 있습니다...",
    "tool_call": "도구를 호출하고 있습니다...",
}


class HistoryTurn(BaseModel):
    command: str
    status: str
    message: str


def _build_task(text: str, history: list[HistoryTurn]) -> str:
    if not history:
        return text
    lines = ["[이전 대화]"]
    for turn in history:
        status_label = "성공" if turn.status == "success" else "실패"
        lines.append(f"사용자: {turn.command}")
        lines.append(f"결과({status_label}): {turn.message}")
    lines.append("")
    lines.append("[현재 명령]")
    lines.append(text)
    return "\n".join(lines)


def _parse_tool_payload(content: str) -> dict:
    try:
        payload = json.loads(content)
        return payload if isinstance(payload, dict) else {"message": str(payload)}
    except json.JSONDecodeError:
        return {"message": content}


async def _execute_plan(plan, tool_to_workbench) -> tuple[dict, bool]:
    if not plan.steps:
        return {"status": "fail", "message": "수행할 작업을 찾지 못했습니다."}, True
    last_payload: dict = {}
    last_is_error = False
    for step in plan.steps:
        workbench = tool_to_workbench.get(step.tool)
        if workbench is None:
            return {"status": "fail", "message": f"알 수 없는 도구: {step.tool}"}, True
        tool_result = await workbench.call_tool(step.tool, step.arguments)
        text = tool_result.result[-1].content if tool_result.result else ""
        last_payload = _parse_tool_payload(text)
        last_is_error = tool_result.is_error
        if last_is_error:
            break
    return last_payload, last_is_error


async def run_command_pipeline(
    text: str,
    history: list[HistoryTurn] | None,
    tools: list[dict],
    router: dict[str, McpWorkbench],
    planner_client,
) -> AsyncGenerator[dict, None]:
    task = _build_task(text, history or [])
    yield stage_event("intent_analysis", STAGE_MESSAGES["intent_analysis"])

    planner = build_planner_agent(planner_client, tools)

    yield stage_event("planning", STAGE_MESSAGES["planning"])
    result = await planner.run(task=task)
    plan = result.messages[-1].content

    yield stage_event("tool_call", STAGE_MESSAGES["tool_call"])
    last_payload, last_is_error = await _execute_plan(plan, router)

    status = "fail" if last_is_error else last_payload.get("status", "fail")
    default_message = (
        "작업을 완료했습니다." if status == "success" else "작업 처리 중 오류가 발생했습니다."
    )
    yield result_event(status, last_payload.get("message", default_message), last_payload)
