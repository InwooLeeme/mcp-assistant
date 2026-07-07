# mcp-server 패키징 스크립트 (Windows)
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
    --name mcp-server `
    --distpath (Join-Path $root "..\dist") `
    --workpath (Join-Path $root "..\build\mcp-server") `
    --specpath (Join-Path $root "..\build") `
    --collect-all mcp `
    --collect-all yt_dlp `
    (Join-Path $root "server.py")
