import os
from pathlib import Path

_FOLDERS: dict[str, str] = {
    "다운로드": "Downloads",
    "downloads": "Downloads",
    "문서": "Documents",
    "documents": "Documents",
    "바탕화면": "Desktop",
    "desktop": "Desktop",
    "사진": "Pictures",
    "pictures": "Pictures",
}


def open_folder(folder_name: str) -> dict:
    subdir = _FOLDERS.get(folder_name.strip().lower())
    if subdir is None:
        allowed = ", ".join(sorted(set(_FOLDERS.values())))
        return {
            "status": "fail",
            "folder": folder_name,
            "message": f"열 수 있는 폴더가 아닙니다. 가능한 폴더: {allowed}",
        }

    path = Path.home() / subdir
    if not path.exists():
        return {
            "status": "fail",
            "folder": subdir,
            "message": f"'{path}' 폴더가 존재하지 않습니다.",
        }

    os.startfile(path)
    return {
        "status": "success",
        "folder": subdir,
        "message": f"'{subdir}' 폴더를 열었습니다.",
    }
