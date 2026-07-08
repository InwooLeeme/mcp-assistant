import subprocess
import logging
from difflib import get_close_matches

logger = logging.getLogger(__name__)

_PROTECTED: frozenset[str] = frozenset(
    {
        "explorer",
        "winlogon",
        "csrss",
        "services",
        "lsass",
        "smss",
        "wininit",
        "system",
        "svchost",
    }
)

_ALIASES: dict[str, str] = {
    "카카오톡": "kakaotalk",
    "카톡": "kakaotalk",
    "크롬": "chrome",
    "메모장": "notepad",
    "계산기": "calculator",
}


def _running_image_stems() -> dict[str, str]:
    result = subprocess.run(
        ["tasklist", "/fo", "csv", "/nh"],
        capture_output=True,
        text=True,
    )
    stems: dict[str, str] = {}
    for line in result.stdout.splitlines():
        line = line.strip()
        if not line:
            continue
        image = line.split('","')[0].strip('"')
        if image.lower().endswith(".exe"):
            stems.setdefault(image[:-4].lower(), image)
    return stems


def close_program(program_name: str) -> dict:
    key = _ALIASES.get(program_name.strip(), program_name.strip()).lower()
    stems = _running_image_stems()

    matched_stem = key if key in stems else None
    if matched_stem is None:
        candidates = get_close_matches(key, list(stems.keys()), n=1, cutoff=0.7)
        if candidates:
            matched_stem = candidates[0]

    if matched_stem is None:
        return {
            "status": "fail",
            "matched": "",
            "message": f"'{program_name}'에 해당하는 실행 중인 프로그램을 찾지 못했습니다.",
        }

    if matched_stem in _PROTECTED:
        return {
            "status": "fail",
            "matched": matched_stem,
            "message": f"'{matched_stem}'은(는) 시스템 핵심 프로세스라 종료할 수 없습니다.",
        }

    image = stems[matched_stem]
    result = subprocess.run(
        ["taskkill", "/IM", image],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        logger.warning("taskkill 실패(%s): %s", image, result.stderr.strip())
        return {
            "status": "fail",
            "matched": image,
            "message": f"'{image}' 종료에 실패했습니다.",
        }
    return {
        "status": "success",
        "matched": image,
        "message": f"'{image}' 종료를 요청했습니다.",
    }
