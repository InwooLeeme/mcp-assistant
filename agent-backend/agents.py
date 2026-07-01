from typing import Literal

from autogen_agentchat.agents import AssistantAgent
from pydantic import BaseModel

PROGRAM_ALIASES: dict[str, str] = {
    "카카오톡": "KakaoTalk",
    "카톡": "KakaoTalk",
    "크롬": "Chrome",
    "메모장": "Notepad",
    "계산기": "Calculator",
}

URL_CATEGORY_HINTS: dict[str, str] = {
    "뉴스": "https://news.naver.com",
    "메일": "https://mail.google.com",
    "날씨": "https://weather.naver.com",
    "지도": "https://map.naver.com",
}


class ToolCallStep(BaseModel):
    tool: Literal["launch_program", "open_url", "play_youtube"]
    arguments: dict[str, str]


class Plan(BaseModel):
    steps: list[ToolCallStep]


PLANNER_SYSTEM_MESSAGE = f"""당신은 PC 개인 비서의 계획 수립 담당자입니다.
사용자의 텍스트 명령을 분석해 아래 3개의 MCP 도구 중 필요한 도구를 어떤 인자로, 어떤 순서로 호출할지 계획을 세우세요.

- launch_program(program_name: string): 설치된 프로그램 실행
- open_url(url: string): 브라우저에서 URL 열기
- play_youtube(query: string): 유튜브 영상 검색 후 재생

프로그램명 별칭 매핑(우선 적용): {PROGRAM_ALIASES}
URL 카테고리 힌트(구체적인 URL이 없는 요청일 때 참고, 매핑에 없으면 자유롭게 추론): {URL_CATEGORY_HINTS}

복합 명령("크롬 열고 뉴스 보여줘" 등)은 여러 단계로 분해하세요.
반드시 정의된 JSON 스키마 형식으로만 응답하세요."""


def build_planner_agent(model_client) -> AssistantAgent:
    return AssistantAgent(
        name="planner",
        model_client=model_client,
        system_message=PLANNER_SYSTEM_MESSAGE,
        output_content_type=Plan,
    )
