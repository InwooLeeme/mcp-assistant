import ctypes

_KEYEVENTF_KEYUP = 0x0002

_ACTIONS: dict[str, int] = {
    "play_pause": 0xB3,
    "next": 0xB0,
    "prev": 0xB1,
    "volume_up": 0xAF,
    "volume_down": 0xAE,
    "mute": 0xAD,
}


def control_media(action: str) -> dict:
    vk = _ACTIONS.get(action)
    if vk is None:
        allowed = ", ".join(_ACTIONS)
        return {
            "status": "fail",
            "action": action,
            "message": f"지원하지 않는 동작입니다. 가능한 값: {allowed}",
        }
    ctypes.windll.user32.keybd_event(vk, 0, 0, 0)
    ctypes.windll.user32.keybd_event(vk, 0, _KEYEVENTF_KEYUP, 0)
    return {
        "status": "success",
        "action": action,
        "message": f"미디어 동작 '{action}'을(를) 실행했습니다.",
    }
