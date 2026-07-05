# client/ (Next.js 프론트엔드)

## 실행 명령
- 저장소 루트에서 실행할 것: `npm --prefix client run dev|build|lint` (`cd client &&`는 피할 것 — cwd가 세션 간 유지되어 이후 명령에 영향을 줌)
- 테스트 프레임워크 없음. 검증은 `npm run build`(타입체크)로 하고, UI 동작은 Playwright MCP로 실제 브라우저에서 확인할 것 — 정적 리뷰/빌드만으로는 못 잡는 버그가 실제로 있었음(아래 참고).

## 구조 및 책임
- `lib/types.ts` — SSE 이벤트 타입(`StageEvent`, `ResultEvent`, `CommandEvent`)
- `lib/sseClient.ts` — `streamCommand(text, baseUrl)`: `POST {baseUrl}/command`를 `fetch`+`ReadableStream`으로 직접 파싱(브라우저 네이티브 `EventSource`는 GET 전용이라 사용 불가). `result` 이벤트를 받으면 즉시 `return`하여 스트림을 종료함(이후 파싱 오류/연결 종료로 성공 결과가 에러로 덮어써지는 것 방지).
- `hooks/useCommandStream.ts` — `{ stages, result, error, isLoading, submit }` 반환. 매 `submit()` 호출마다 이전 상태를 전부 초기화(대화 컨텍스트 유지 안 함).
- `components/CommandForm.tsx`, `ProgressLog.tsx`, `ResultMessage.tsx` — 순수 프레젠테이션 컴포넌트, 로직 없음.
- `app/page.tsx` — 위 컴포넌트/훅 조립. `NEXT_PUBLIC_AGENT_URL` 환경변수(기본값 `http://localhost:8000`) 사용.
- `hooks/useConversations.ts` — 여러 대화·활성 대화·CRUD·localStorage 영속화를 담당하는 훅.
- `lib/conversationStore.ts` — 대화 목록을 localStorage에 읽고 쓰는 함수(빈 대화는 저장 안 함).
- `components/ConversationSidebar.tsx` — 대화 목록·전환·삭제·새 대화 버튼을 그리는 왼쪽 사이드바.
- import alias `@/*` → `client/` 루트 기준.

## SSE 이벤트 계약 (Agent 백엔드가 반드시 따라야 함)
```
data: {"type":"stage","stage":"intent_analysis"|"planning"|"tool_call","message":"..."}\n\n
data: {"type":"result","status":"success"|"fail","message":"...","detail":{...}}\n\n
```
스트림은 정확히 하나의 `result`로 끝나야 함. HTTP `response.ok === false`면 클라이언트는 에러로 처리.

## 알려진 함정
- `fetch()`가 네트워크 자체에 실패하면(백엔드 연결 불가 등) 브라우저가 던지는 건 한국어 메시지가 아니라 네이티브 `TypeError`("Failed to fetch")임. `useCommandStream.ts`의 catch 블록에서 `err instanceof TypeError`를 별도 분기해 한국어 메시지로 치환하고 있음 — 에러 메시지를 그대로(`err.message`) 노출하는 코드로 되돌리지 말 것.
- 대화 목록 영속화는 localStorage이므로 반드시 `useEffect`(마운트 후)에서 로드해야 함 — 렌더 중 `localStorage`/`crypto.randomUUID()` 접근은 SSR 하이드레이션 불일치를 유발함.
- `create-next-app@latest` 기준 Next.js 16.x + Tailwind v4(`tailwind.config.ts` 없음, `globals.css`의 `@import "tailwindcss"`로 설정) + ESLint 9 flat config(`eslint.config.mjs`). 구버전 Tailwind v3 문법(`tailwind.config.js`)을 가정하지 말 것.
- `.gitignore`의 `.env*` 규칙 때문에 `.env.local.example` 같은 템플릿 파일은 `!.env*.example` 예외가 있어야 추적됨(이미 추가됨).
