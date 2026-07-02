# MCP 기반 PC용 개인 텍스트 비서

텍스트 명령으로 PC 작업(프로그램 실행, URL 열기, YouTube 재생)을 자동 수행하는 로컬 개인 비서.

## 구성

- `client/` — Next.js 텍스트 입력 UI (localhost:3000)
- `agent-backend/` — FastAPI + AutoGen(Gemini) Agent 백엔드 (localhost:8000)
- `mcp-server/` — 로컬 네이티브 MCP 서버 (OS 액션 직접 수행, Agent가 stdio로 기동)

## 환경변수

| 변수 | 위치 | 기본값 | 설명 |
|------|------|--------|------|
| `GEMINI_API_KEY` | agent-backend/.env | (필수) | Gemini API 키 |
| `GEMINI_MODEL` | agent-backend/.env | `gemini-2.5-flash` | 사용할 Gemini 모델 |
| `AGENT_PORT` | agent-backend/.env | `8000` | Agent 백엔드 포트 |
| `CORS_ALLOW_ORIGIN` | agent-backend/.env | `http://localhost:3000` | 허용할 클라이언트 오리진 |
| `MCP_SERVER_COMMAND` | agent-backend/.env | (필수) | MCP 서버를 기동할 python 실행 파일 경로 |
| `MCP_SERVER_ARGS` | agent-backend/.env | (필수) | MCP 서버 스크립트 경로 |
| `NEXT_PUBLIC_AGENT_URL` | client/.env.local | `http://localhost:8000` | 클라이언트가 호출할 백엔드 URL |

## 실행 순서

1. `.env.example`을 참고해 `agent-backend/.env`와 `client/.env.local`을 작성한다.
2. Agent 백엔드 + MCP 서버 준비·기동:
   ```powershell
   ./run.ps1
   ```
3. 새 터미널에서 클라이언트 기동:
   ```powershell
   npm --prefix client install
   npm --prefix client run dev
   ```
4. 브라우저에서 `http://localhost:3000` 접속.

## 데모 명령

- `카카오톡 실행해 줘` — 프로그램 실행
- `뉴스 페이지 열어줘` — URL 열기
- `카페 음악 재생해 줘` — YouTube 재생
