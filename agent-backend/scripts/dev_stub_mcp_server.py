from mcp.server.fastmcp import FastMCP

mcp = FastMCP("MCP Assistant Dev Stub")

@mcp.tool()
def launch_program(program_name: str) -> dict:
    """설치된 프로그램을 이름으로 찾아 실행한다."""
    return {
        "status": "success",
        "matched": program_name,
        "message": f"'{program_name}' 실행을 시작했습니다.",
    }


@mcp.tool()
def open_url(url: str) -> dict:
    """주어진 URL을 기본 브라우저에서 연다."""
    return {
        "status": "success",
        "url": url,
        "message": f"'{url}' 페이지를 열었습니다.",
    }


@mcp.tool()
def play_youtube(query: str) -> dict:
    """검색어로 유튜브 영상을 찾아 재생한다."""
    return {
        "status": "success",
        "url": f"https://www.youtube.com/results?search_query={query}",
        "title": query,
        "message": f"'{query}' 재생을 시작했습니다.",
    }


if __name__ == "__main__":
    mcp.run()
