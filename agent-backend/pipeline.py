import json
import logging
from contextlib import AsyncExitStack
from typing import AsyncGenerator

from autogen_agentchat.base import TaskResult
from autogen_agentchat.conditions import TextMentionTermination
from autogen_agentchat.messages import StructuredMessage, ToolCallExecutionEvent
from autogen_agentchat.teams import SelectorGroupChat
from autogen_ext.tools.mcp import McpWorkbench

from agents import Plan, build_executor_agent, build_planner_agent, build_user_proxy
from llm_client import get_model_client
import mcp_config
from sse import result_event, stage_event

logger = logging.getLogger("agent-backend")

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

    model_client = get_model_client()
    planning_emitted = False
    tool_call_emitted = False
    last_payload: dict = {}
    last_is_error = False

    try:
        async with AsyncExitStack() as stack:
            workbenches = []
            tools: list[dict] = []
            for name, entry in mcp_config.list_servers().items():
                try:
                    params = mcp_config.to_server_params(entry)
                    workbench = await stack.enter_async_context(McpWorkbench(server_params=params))
                    server_tools = await workbench.list_tools()
                    workbenches.append(workbench)
                    tools.extend(server_tools)
                except Exception:
                    logger.warning("MCP 서버 '%s' 연결 실패, 건너뜁니다.", name, exc_info=True)

            planner = build_planner_agent(model_client, tools)
            executor = build_executor_agent(model_client, workbenches)
            user_proxy = build_user_proxy()

            team = SelectorGroupChat(
                [user_proxy, planner, executor],
                model_client=model_client,
                termination_condition=TextMentionTermination("TERMINATE"),
                custom_message_types=[StructuredMessage[Plan]],
            )

            async for message in team.run_stream(task=text):
                if isinstance(message, TaskResult):
                    continue

                source = getattr(message, "source", "")
                if source == "planner" and not planning_emitted:
                    yield stage_event("planning", STAGE_MESSAGES["planning"])
                    planning_emitted = True
                if source == "executor" and not tool_call_emitted:
                    yield stage_event("tool_call", STAGE_MESSAGES["tool_call"])
                    tool_call_emitted = True

                if isinstance(message, ToolCallExecutionEvent):
                    result = message.content[-1]
                    last_payload = _parse_tool_payload(result.content)
                    last_is_error = result.is_error
    finally:
        await model_client.close()

    status = "fail" if last_is_error else last_payload.get("status", "fail")
    default_message = (
        "작업을 완료했습니다." if status == "success" else "작업 처리 중 오류가 발생했습니다."
    )
    yield result_event(status, last_payload.get("message", default_message), last_payload)
