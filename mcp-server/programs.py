import os
import winreg
from difflib import get_close_matches
from pathlib import Path

_START_MENU_DIRS = [
    Path(os.environ.get("PROGRAMDATA", "")) / "Microsoft" / "Windows" / "Start Menu" / "Programs",
    Path(os.environ.get("APPDATA", "")) / "Microsoft" / "Windows" / "Start Menu" / "Programs",
]

_APP_PATHS_SUBKEY = r"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths"


def _scan_start_menu() -> dict[str, str]:
    index: dict[str, str] = {}
    for base in _START_MENU_DIRS:
        if not base.exists():
            continue
        for lnk in base.rglob("*.lnk"):
            index.setdefault(lnk.stem.lower(), str(lnk))
    return index


def _scan_app_paths() -> dict[str, str]:
    index: dict[str, str] = {}
    for root in (winreg.HKEY_LOCAL_MACHINE, winreg.HKEY_CURRENT_USER):
        try:
            key = winreg.OpenKey(root, _APP_PATHS_SUBKEY)
        except FileNotFoundError:
            continue
        with key:
            i = 0
            while True:
                try:
                    sub = winreg.EnumKey(key, i)
                except OSError:
                    break
                i += 1
                try:
                    with winreg.OpenKey(key, sub) as subkey:
                        path, _ = winreg.QueryValueEx(subkey, None)
                except OSError:
                    continue
                index.setdefault(Path(sub).stem.lower(), path)
    return index


def _build_index() -> dict[str, str]:
    index = _scan_app_paths()
    index.update(_scan_start_menu())
    return index


def launch_program(program_name: str) -> dict:
    index = _build_index()
    key = program_name.strip().lower()

    target = index.get(key)
    matched = program_name if target else None
    if target is None:
        candidates = get_close_matches(key, list(index.keys()), n=1, cutoff=0.7)
        if candidates:
            matched = candidates[0]
            target = index[matched]

    if target is None:
        suggestions = get_close_matches(key, list(index.keys()), n=5, cutoff=0.3)
        tail = f" 비슷한 프로그램: {', '.join(suggestions)}" if suggestions else ""
        return {
            "status": "fail",
            "matched": "",
            "message": f"'{program_name}'에 해당하는 설치된 프로그램을 찾지 못했습니다.{tail}",
        }

    try:
        os.startfile(target)
    except OSError as exc:
        return {
            "status": "fail",
            "matched": matched,
            "message": f"'{matched}' 실행에 실패했습니다: {exc}",
        }

    return {
        "status": "success",
        "matched": matched,
        "message": f"'{matched}' 실행을 시작했습니다.",
    }
