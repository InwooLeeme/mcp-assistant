import webbrowser

from yt_dlp import YoutubeDL

_YDL_OPTS = {
    "quiet": True,
    "no_warnings": True,
    "skip_download": True,
    "noplaylist": True,
    "extract_flat": True,
}


def play_youtube(query: str) -> dict:
    if not query.strip():
        return {
            "status": "fail",
            "url": "",
            "title": "",
            "message": "검색어가 비어 있습니다. 재생할 곡명이나 검색어를 함께 말씀해 주세요.",
        }

    try:
        with YoutubeDL(_YDL_OPTS) as ydl:
            info = ydl.extract_info(f"ytsearch1:{query}", download=False)
    except Exception as exc:
        return {
            "status": "fail",
            "url": "",
            "title": "",
            "message": f"'{query}' 검색 중 오류가 발생했습니다: {exc}",
        }

    entries = info.get("entries") or []
    if not entries:
        return {
            "status": "fail",
            "url": "",
            "title": "",
            "message": f"'{query}'에 대한 검색 결과가 없습니다.",
        }

    top = entries[0]
    video_id = top.get("id", "")
    url = top.get("url") or top.get("webpage_url") or f"https://www.youtube.com/watch?v={video_id}"
    title = top.get("title") or query

    webbrowser.open(url)
    return {
        "status": "success",
        "url": url,
        "title": title,
        "message": f"'{title}' 재생을 시작했습니다.",
    }
