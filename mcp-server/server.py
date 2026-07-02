import webbrowser
from urllib.parse import urlparse

from mcp.server.fastmcp import FastMCP

from programs import launch_program as _launch_program
from youtube import play_youtube as _play_youtube

mcp = FastMCP("MCP Assistant Server")


@mcp.tool()
def launch_program(program_name: str) -> dict:
    """설치된 프로그램을 이름으로 찾아 실행한다."""
    return _launch_program(program_name)


@mcp.tool()
def play_youtube(query: str) -> dict:
    """검색어로 유튜브 영상을 찾아 기본 브라우저에서 재생한다."""
    return _play_youtube(query)


@mcp.tool()
def open_url(url: str) -> dict:
    """주어진 URL을 기본 브라우저에서 연다. https만 허용한다."""
    parsed = urlparse(url)
    if parsed.scheme != "https":
        return {
            "status": "fail",
            "url": url,
            "message": "https로 시작하는 URL만 열 수 있습니다.",
        }
    webbrowser.open(url)
    return {
        "status": "success",
        "url": url,
        "message": f"'{url}' 페이지를 열었습니다.",
    }


if __name__ == "__main__":
    mcp.run()
