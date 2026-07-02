import subprocess
from difflib import get_close_matches

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

    image = stems.get(key)
    if image is None:
        candidates = get_close_matches(key, list(stems.keys()), n=1, cutoff=0.5)
        if candidates:
            image = stems[candidates[0]]

    if image is None:
        running = ", ".join(sorted(stems.keys())[:10])
        return {
            "status": "fail",
            "matched": "",
            "message": f"'{program_name}'에 해당하는 실행 중인 프로그램을 찾지 못했습니다. 실행 중: {running}",
        }

    result = subprocess.run(
        ["taskkill", "/IM", image],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return {
            "status": "fail",
            "matched": image,
            "message": f"'{image}' 종료에 실패했습니다: {result.stderr.strip()}",
        }
    return {
        "status": "success",
        "matched": image,
        "message": f"'{image}' 종료를 요청했습니다.",
    }
