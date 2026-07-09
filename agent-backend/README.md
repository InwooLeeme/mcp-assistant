# agent-backend — 명령 해석 및 오케스트레이션

사용자 문장을 받아서 "무엇을 할지" 판단하고, 그 결정을 MCP 서버에 실행시키는 FastAPI 서버입니다. 실제로 프로그램을 켜거나 브라우저를 여는 코드는 여기에 없습니다 — 이 프로젝트는 오직 판단과 조율만 담당하고, 실행은 [mcp-server](../mcp-server/README.md)에 위임합니다.

## 요청 흐름

클라이언트가 `POST /command`로 `{"text": "카페 음악 재생해 줘", "history": [{"command": "...", "status": "success", "message": "..."}]}`를 보내면, `main.py`가 `pipeline.run_command_pipeline(text, history)`를 호출해서 나오는 이벤트를 그대로 SSE로 스트리밍합니다(`sse.py`). `history`는 클라이언트가 관리하는 같은 대화의 이전 턴들이며(백엔드는 요청 간 아무것도 저장하지 않는 무상태 서버), `pipeline.py`의 `_build_task`가 이를 "[이전 대화]" 프리앰블로 조립해 `text` 앞에 붙입니다 — `history`가 비어 있으면 프리앰블 없이 `text`가 그대로 전달되어 이전 동작과 동일합니다. 내부적으로는 planner 에이전트(AutoGen AssistantAgent)가 이 프리앰블 포함 task로 계획을 세우고, 파이썬 코드가 그 계획을 순서대로 실행합니다(`pipeline.py`, `agents.py`).

1. **planner** — "카페 음악 재생해 줘"라는 문장을 보고 `play_youtube(query="카페 음악")` 같은 도구 호출 계획을 세웁니다. 응답은 `Plan`이라는 고정 스키마(`agents.py`의 `ToolCallStep`, `Plan`)로만 나오도록 강제되어 있어서, LLM이 엉뚱한 형식으로 답할 여지를 줄였습니다. "크롬 열고 뉴스 보여줘" 같은 복합 명령은 여러 단계로 쪼개서 계획합니다.
2. **실행 루프(코드)** — planner가 세운 Plan의 각 단계를 `McpWorkbench`(`call_tool`)를 통해 MCP 서버의 도구로 순서대로 실행합니다. 어떤 단계가 실패하면 즉시 중단하고 그 결과를 보고합니다. 도구 재선택이나 결과 요약을 위한 별도 LLM 호출은 없습니다.

이 과정에서 `pipeline.py`는 `intent_analysis` → `planning` → `tool_call` 순서로 정해진 지점마다 stage 이벤트를 클라이언트에 흘려보내고, 마지막 도구 호출 결과를 하나의 `result` 이벤트로 정리해서 보냅니다.

## 파일별 역할

- `main.py` — FastAPI 앱. `/health`, `/command`(SSE) 두 엔드포인트.
- `pipeline.py` — planner를 실행해 Plan을 얻고, `_execute_plan`이 그 Plan을 순차 집행하며 SSE 이벤트로 변환하는 오케스트레이션 로직. `HistoryTurn` 모델과 `_build_task`가 클라이언트가 보낸 이전 대화 턴을 "[이전 대화]" 프리앰블로 조립하는 것도 여기서 담당합니다.
- `agents.py` — planner 에이전트 정의, 프로그램 별칭 표(`PROGRAM_ALIASES`), URL 카테고리 힌트(`URL_CATEGORY_HINTS`), `Plan` 스키마.
- `llm_client.py` — Gemini를 OpenAI 호환 API로 부르는 `OpenAIChatCompletionClient` 생성.
- `mcp_config.py` — 개발 환경의 `mcp_servers.json`과 설치 환경의 사용자별 설정 파일을 로딩·저장하고 서버 목록 조회·추가·삭제를 처리합니다.
- `sse.py` — SSE 이벤트 딕셔너리 생성 및 `data: ...\n\n` 포맷팅.
- `config.py` — `.env` 로딩 및 환경변수 읽기.

## 환경변수 (`.env`)

```
GEMINI_API_KEY=              # 필수, Gemini API 키
GEMINI_MODEL=gemini-2.0-flash
PLANNER_MODEL=               # 선택, 미지정 시 GEMINI_MODEL
AGENT_PORT=8000
CORS_ALLOW_ORIGIN=http://localhost:3000
```

LLM 에이전트는 planner 하나뿐이며, `PLANNER_MODEL`로 모델을 지정할 수 있고 지정하지 않으면 `GEMINI_MODEL`을 씁니다.

개발 환경의 MCP 서버 목록은 `agent-backend/mcp_servers.json`에서 관리합니다. PyInstaller 설치 환경에서는 `%APPDATA%\mcp-assistant\mcp_servers.json`을 사용합니다. 사용자 설정 파일이 없으면 실행 파일 옆의 번들 설정을 최초 1회 복사하고, 이미 존재하는 사용자 설정은 덮어쓰지 않습니다.

파이프라인은 등록된 모든 서버에 연결해 도구를 합쳐 planner에 전달합니다. `GET/POST/DELETE /mcp-servers`로 목록 조회·추가·삭제할 수 있고, 한 서버가 연결에 실패해도 나머지로 계속 동작합니다.

`GEMINI_MODEL`은 모델 등급에 따라 지시 이행 능력 차이가 꽤 큽니다. 가벼운 모델(`gemini-2.5-flash-lite` 등)은 `PROGRAM_ALIASES` 같은 프롬프트 안의 매핑 표를 놓치고 원문을 그대로 도구에 넘기는 경우가 있었습니다. 별칭 매칭이 잘 안 될 때는 429(할당량 초과) 에러인지, 아니면 응답 자체는 정상인데 모델이 지시를 놓친 것인지 구분해서 봐야 합니다.

## 실행

```powershell
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\python -m uvicorn main:app --port 8000
```

저장소 루트의 `run.ps1`을 쓰면 `mcp-server`까지 함께 venv 준비 및 기동을 처리해줍니다.
