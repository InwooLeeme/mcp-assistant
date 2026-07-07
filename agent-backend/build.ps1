# agent-backend 패키징 스크립트 (Windows)
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
if ([string]::IsNullOrEmpty($root)) {
    $root = $PWD.Path
}

$venvPython = Join-Path $root ".venv\Scripts\python.exe"
if (-not (Test-Path $venvPython)) {
    throw "가상환경이 없습니다. 먼저 run.ps1로 .venv를 생성하세요: $venvPython"
}

& $venvPython -m pip install -r (Join-Path $root "requirements-build.txt")

& $venvPython -m PyInstaller `
    --onedir `
    --noconfirm `
    --name agent-backend `
    --distpath (Join-Path $root "..\dist") `
    --workpath (Join-Path $root "..\build\agent-backend") `
    --specpath (Join-Path $root "..\build") `
    --collect-all autogen_core `
    --collect-all autogen_agentchat `
    --collect-all autogen_ext `
    --collect-all mcp `
    --collect-all uvicorn `
    --collect-all fastapi `
    (Join-Path $root "main.py")

Copy-Item (Join-Path $root "mcp_servers.json") (Join-Path $root "..\dist\agent-backend\mcp_servers.json") -Force

# .env는 설치파일에 평문 번들하지 않는다.
# 실행 시 Tauri 셸(src-tauri/src/main.rs)이 %APPDATA%\mcp-assistant\.env에서 읽어 자식 프로세스 환경변수로 주입한다.
$bundledEnv = Join-Path $root "..\dist\agent-backend\.env"
if (Test-Path $bundledEnv) {
    Remove-Item $bundledEnv -Force
}
