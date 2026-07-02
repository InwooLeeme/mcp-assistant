# MCP Assistant 로컬 실행 스크립트 (Windows)
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
if ([string]::IsNullOrEmpty($root)) {
    $root = $PWD.Path
}

# 1. Agent 백엔드 가상환경 준비
$agentVenv = Join-Path $root "agent-backend\.venv"
if (-not (Test-Path $agentVenv)) {
    python -m venv $agentVenv
}
& (Join-Path $agentVenv "Scripts\pip.exe") install -r (Join-Path $root "agent-backend\requirements.txt")

# 2. MCP 서버 가상환경 준비
$mcpVenv = Join-Path $root "mcp-server\.venv"
if (-not (Test-Path $mcpVenv)) {
    python -m venv $mcpVenv
}
& (Join-Path $mcpVenv "Scripts\pip.exe") install -r (Join-Path $root "mcp-server\requirements.txt")

# 3. Agent 백엔드 기동 (MCP 서버는 stdio 서브프로세스로 자동 기동)
Write-Host "Agent 백엔드를 http://localhost:8000 에서 기동합니다..."
& (Join-Path $agentVenv "Scripts\python.exe") -m uvicorn main:app --app-dir (Join-Path $root "agent-backend") --port 8000
