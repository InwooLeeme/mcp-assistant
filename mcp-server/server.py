import webbrowser
from urllib.parse import urlparse

from mcp.server.fastmcp import FastMCP

from folders import open_folder as _open_folder
from media import control_media as _control_media
from processes import close_program as _close_program
from programs import launch_program as _launch_program
from youtube import play_youtube as _play_youtube

mcp = FastMCP("MCP Assistant Server")


@mcp.tool()
def launch_program(program_name: str) -> dict:
    """설치된 프로그램을 이름으로 찾아 실행한다."""
    return _launch_program(program_name)


@mcp.tool()
def close_program(program_name: str) -> dict:
    """실행 중인 프로그램을 이름으로 찾아 정상 종료(창 닫기)한다."""
    return _close_program(program_name)


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


@mcp.tool()
def control_media(action: str) -> dict:
    """미디어를 제어한다. action은 다음 중 하나:
    play_pause(재생/일시정지), next(다음 곡), prev(이전 곡),
    volume_up(볼륨 올리기), volume_down(볼륨 내리기), mute(음소거)."""
    return _control_media(action)


@mcp.tool()
def open_folder(folder_name: str) -> dict:
    """주요 사용자 폴더를 탐색기로 연다. folder_name은 다음 중 하나:
    다운로드(Downloads), 문서(Documents), 바탕화면(Desktop), 사진(Pictures)."""
    return _open_folder(folder_name)


if __name__ == "__main__":
    mcp.run()
