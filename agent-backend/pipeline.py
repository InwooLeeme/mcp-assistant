import json
from typing import AsyncGenerator

from autogen_agentchat.messages import TextMessage
from autogen_core import CancellationToken
from autogen_ext.tools.mcp import McpWorkbench

from agents import Plan, build_planner_agent
from llm_client import get_model_client
from mcp_tools import get_mcp_server_params
from sse import result_event, stage_event

STAGE_MESSAGES = {
    "intent_analysis": "의도를 분석하고 있습니다...",
    "planning": "계획을 세우고 있습니다...",
    "tool_call": "도구를 호출하고 있습니다...",
}


def _parse_tool_payload(content: str) -> dict:
    try:
        payload = json.loads(content)
        return payload if isinstance(payload, dict) else {"message": str(payload)}
    except json.JSONDecodeError:
        return {"message": content}


async def run_command_pipeline(text: str) -> AsyncGenerator[dict, None]:
    yield stage_event("intent_analysis", STAGE_MESSAGES["intent_analysis"])
    yield stage_event("planning", STAGE_MESSAGES["planning"])

    model_client = get_model_client()
    try:
        planner = build_planner_agent(model_client)
        response = await planner.on_messages(
            [TextMessage(content=text, source="user")], CancellationToken()
        )
        plan: Plan = response.chat_message.content
    finally:
        await model_client.close()

    if not plan.steps:
        yield result_event("fail", "수행할 작업을 파악하지 못했습니다.", {})
        return

    yield stage_event("tool_call", STAGE_MESSAGES["tool_call"])

    last_payload: dict = {}
    last_is_error = False
    async with McpWorkbench(server_params=get_mcp_server_params()) as workbench:
        for step in plan.steps:
            tool_result = await workbench.call_tool(
                step.tool, step.arguments, CancellationToken()
            )
            last_payload = _parse_tool_payload(tool_result.to_text())
            last_is_error = tool_result.is_error
            if last_is_error:
                break

    status = "fail" if last_is_error else last_payload.get("status", "fail")
    default_message = (
        "작업을 완료했습니다." if status == "success" else "작업 처리 중 오류가 발생했습니다."
    )
    yield result_event(status, last_payload.get("message", default_message), last_payload)
