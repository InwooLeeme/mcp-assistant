# client — 텍스트 비서 UI

Next.js(App Router)로 만든 아주 단순한 화면입니다. 입력창 하나, 진행 상황 로그, 결과 메시지 — 이게 전부입니다. 화면 자체에는 로직이 거의 없고, 대부분의 동작은 `agent-backend`가 보내주는 SSE(Server-Sent Events) 스트림을 그대로 화면에 옮겨 그리는 것입니다.

## 동작 방식

사용자가 문장을 입력하고 제출하면 `agent-backend`의 `POST /command`로 요청을 보냅니다. 이 엔드포인트는 일반 REST 응답이 아니라 스트림을 돌려주는데, 브라우저 내장 `EventSource`는 GET 요청만 지원하기 때문에 `fetch` + `ReadableStream`을 직접 파싱해서 처리합니다(`lib/sseClient.ts`). 스트림에는 두 종류의 이벤트가 옵니다.

```
data: {"type":"stage","stage":"intent_analysis"|"planning"|"tool_call","message":"..."}
data: {"type":"result","status":"success"|"fail","message":"...","detail":{...}}
```

`stage` 이벤트가 오는 동안 화면에는 "의도를 분석하고 있습니다..." 같은 진행 로그가 쌓이고, 마지막에 정확히 하나의 `result` 이벤트가 오면 그걸로 스트림을 끝내고 성공/실패 메시지를 보여줍니다.

## 구조

- `app/page.tsx` — 화면 조립. 아래 컴포넌트/훅을 가져다 붙이기만 합니다.
- `hooks/useCommandStream.ts` — 실제 로직이 모여 있는 곳. `{ stages, result, error, isLoading, submit }`을 반환하고, `submit()`을 호출할 때마다 이전 상태를 전부 초기화합니다(대화 맥락을 유지하는 챗봇이 아니라 매번 새 명령을 처리하는 구조라서요).
- `lib/sseClient.ts` — SSE 스트림을 파싱하는 `streamCommand(text, baseUrl)` 함수.
- `lib/types.ts` — 위에서 언급한 이벤트 타입 정의.
- `components/CommandForm.tsx`, `ProgressLog.tsx`, `ResultMessage.tsx` — 로직 없는 순수 프레젠테이션 컴포넌트.

import alias `@/*`는 `client/` 루트를 가리킵니다.

## 실행

저장소 루트에서:

```powershell
npm --prefix client install
npm --prefix client run dev
```

`http://localhost:3000`에서 확인할 수 있습니다. `client/.env.local`에 `NEXT_PUBLIC_AGENT_URL`을 설정하지 않으면 기본값으로 `http://localhost:8000`(agent-backend)을 바라봅니다.

## 알아두면 좋은 것들

- 테스트 프레임워크가 따로 없습니다. 타입 오류는 `npm run build`로 잡고, 실제 동작은 브라우저에서 직접 확인하는 방식으로 검증합니다.
- `fetch()`가 네트워크 단에서 실패하면(백엔드가 꺼져 있는 경우 등) 브라우저는 한국어 메시지가 아니라 `TypeError: Failed to fetch`를 던집니다. `useCommandStream.ts`에서 이 경우를 따로 잡아 한국어 메시지로 바꿔주고 있으니, 에러 메시지를 그대로 노출하는 방식으로 되돌리지 않도록 주의해 주세요.
- Next.js 16 + Tailwind v4 + ESLint 9(flat config) 조합이라 `tailwind.config.js` 같은 구버전 설정 파일은 없습니다. Tailwind 설정은 `app/globals.css`의 `@import "tailwindcss"`로 되어 있습니다.
