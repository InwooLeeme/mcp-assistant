# mcp-server — 로컬 OS 액션 실행기

Windows 로컬 PC에 실제로 손을 대는 부분입니다. MCP(Model Context Protocol) 공식 Python SDK(`FastMCP`)로 만들었고, `agent-backend`가 stdio 서브프로세스로 이 서버를 띄운 뒤 도구를 호출합니다. 독립적으로 재사용 가능하도록 설계했기 때문에, 나중에 다른 LLM이나 다른 클라이언트에서도 이 서버 하나로 "프로그램 실행 / URL 열기 / 유튜브 재생"을 그대로 가져다 쓸 수 있습니다.

## 제공하는 도구 3가지

### `launch_program(program_name: str)`
설치된 프로그램을 이름으로 찾아 실행합니다(`programs.py`). 프로그램 목록은 두 군데에서 긁어옵니다.

- 시작 메뉴의 `.lnk` 바로가기 파일들 (`PROGRAMDATA`, `APPDATA` 하위)
- 레지스트리 `SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths` (HKLM, HKCU)

이름이 정확히 일치하지 않으면 `difflib.get_close_matches`로 비슷한 이름을 찾아 실행하고(cutoff 0.5), 그것도 실패하면 후보 5개를 제시하며 실패 응답을 돌려줍니다. 실행 자체는 `os.startfile`을 씁니다.

### `open_url(url: str)`
`webbrowser.open`으로 기본 브라우저에서 URL을 엽니다. `https`가 아닌 스킴은 거부합니다 — `file://`이나 `javascript:` 같은 걸 LLM이 실수로든 의도적으로든 넘기는 걸 막기 위한 최소한의 안전장치입니다.

### `play_youtube(query: str)`
`yt-dlp`로 `ytsearch1:검색어` 검색을 돌려 1위 결과의 URL을 얻은 뒤 브라우저로 엽니다(`youtube.py`). `extract_flat`, `skip_download` 옵션을 켜서 실제 영상을 다운로드하지 않고 메타데이터(제목, URL)만 가볍게 가져옵니다.

## 왜 여기서 판단하지 않는가

세 도구 모두 "무엇을 실행할지 알아서 판단"하지 않습니다. `launch_program`은 이름 매칭만, `open_url`은 스킴 검증만, `play_youtube`는 검색 1위 반환만 합니다. 어떤 프로그램을, 어떤 URL을, 어떤 검색어로 부를지는 전부 `agent-backend`의 planner가 결정해서 넘겨줍니다. 이 서버는 순수하게 "지시받은 대로 OS를 조작하는" 실행 계층입니다.

## 실행

```powershell
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\python server.py
```

보통은 직접 실행할 일이 없고, `agent-backend/.env`의 `MCP_SERVER_COMMAND`(python.exe 경로)와 `MCP_SERVER_ARGS`(`server.py` 경로)를 설정해두면 Agent 백엔드가 알아서 서브프로세스로 띄웁니다.

## 참고

- Windows 전용입니다(`winreg`, `os.startfile`을 직접 사용). 다른 OS에서는 동작하지 않습니다.
- VSCode에서 `yt_dlp` import 관련 Pylint 경고가 뜬다면, 대부분 VSCode가 `mcp-server/.venv`가 아닌 다른 Python 인터프리터를 보고 있어서 발생하는 표시 문제입니다. `Python: Select Interpreter`에서 `mcp-server\.venv\Scripts\python.exe`로 바꿔주면 사라집니다.
