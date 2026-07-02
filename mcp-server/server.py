import webbrowser
from urllib.parse import urlparse

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("MCP Assistant Server")


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
