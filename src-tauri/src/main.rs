#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::ffi::OsStr;
use std::iter::once;
use std::os::windows::ffi::OsStrExt;
use std::os::windows::io::AsRawHandle;
use std::os::windows::process::CommandExt;
use std::path::PathBuf;
use std::process::{Child, Command};
use std::sync::Mutex;

use tauri::Manager;
use tauri::{WebviewUrl, WebviewWindowBuilder};
use windows::core::PCWSTR;
use windows::Win32::Foundation::HANDLE;
use windows::Win32::System::JobObjects::{
    AssignProcessToJobObject, CreateJobObjectW, JobObjectExtendedLimitInformation,
    SetInformationJobObject, JOBOBJECT_EXTENDED_LIMIT_INFORMATION,
    JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE,
};
use windows::Win32::UI::WindowsAndMessaging::{MessageBoxW, MB_ICONERROR, MB_OK};

const CREATE_NO_WINDOW: u32 = 0x0800_0000;

struct BackendProcess(Mutex<Option<Child>>);

fn generate_token() -> String {
    let mut bytes = [0u8; 32];
    getrandom::getrandom(&mut bytes).expect("토큰 생성에 실패했습니다.");
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

fn to_wide(text: &str) -> Vec<u16> {
    OsStr::new(text).encode_wide().chain(once(0)).collect()
}

fn show_error_dialog(message: &str) {
    let message = to_wide(message);
    let title = to_wide("MCP Assistant 오류");
    unsafe {
        MessageBoxW(
            None,
            PCWSTR(message.as_ptr()),
            PCWSTR(title.as_ptr()),
            MB_OK | MB_ICONERROR,
        );
    }
}

fn secret_env_path() -> Option<PathBuf> {
    let appdata = std::env::var_os("APPDATA")?;
    Some(PathBuf::from(appdata).join("mcp-assistant").join(".env"))
}

fn apply_secret_env(command: &mut Command) -> Result<(), String> {
    let path = secret_env_path().ok_or_else(|| "APPDATA 환경변수를 찾을 수 없습니다.".to_string())?;
    let contents = std::fs::read_to_string(&path).map_err(|_| {
        format!(
            "GEMINI_API_KEY 설정 파일이 없습니다.\n\n다음 경로에 파일을 만들고 아래 형식으로 저장한 뒤 다시 실행하세요:\n{}\n\nGEMINI_API_KEY=발급받은_API_키",
            path.display()
        )
    })?;
    for line in contents.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        if let Some((key, value)) = line.split_once('=') {
            command.env(key.trim(), value.trim());
        }
    }
    Ok(())
}

/// 작업 관리자 강제 종료 등 CloseRequested를 우회하는 경로에서도
/// mcp-assistant.exe 프로세스가 사라지면 OS가 자식(agent-backend/mcp-server)까지 함께 정리하도록
/// Job Object에 KILL_ON_JOB_CLOSE를 걸어둔다. 실패해도 CloseRequested 경로가 주 정리 수단이므로 치명적이지 않다.
fn assign_kill_on_close_job(child: &Child) -> windows::core::Result<()> {
    unsafe {
        let job = CreateJobObjectW(None, PCWSTR::null())?;
        let mut info = JOBOBJECT_EXTENDED_LIMIT_INFORMATION::default();
        info.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
        SetInformationJobObject(
            job,
            JobObjectExtendedLimitInformation,
            &info as *const _ as *const _,
            std::mem::size_of::<JOBOBJECT_EXTENDED_LIMIT_INFORMATION>() as u32,
        )?;
        let process_handle = HANDLE(child.as_raw_handle() as _);
        AssignProcessToJobObject(job, process_handle)?;
    }
    Ok(())
}

fn spawn_backend(app: &tauri::AppHandle, token: &str) -> Child {
    let resource_dir = match app.path().resource_dir() {
        Ok(dir) => dir,
        Err(err) => {
            show_error_dialog(&format!("리소스 디렉터리를 찾을 수 없습니다: {err}"));
            std::process::exit(1);
        }
    };
    let exe_path = resource_dir.join("agent-backend").join("agent-backend.exe");

    let mut command = Command::new(&exe_path);
    command.creation_flags(CREATE_NO_WINDOW);
    command.env("AGENT_TOKEN", token);

    if let Err(message) = apply_secret_env(&mut command) {
        show_error_dialog(&message);
        std::process::exit(1);
    }

    let child = match command.spawn() {
        Ok(child) => child,
        Err(err) => {
            show_error_dialog(&format!("agent-backend.exe 실행에 실패했습니다: {err}"));
            std::process::exit(1);
        }
    };

    let _ = assign_kill_on_close_job(&child);

    child
}

fn kill_backend(child: &mut Child) {
    let pid = child.id();
    let _ = Command::new("taskkill")
        .args(["/PID", &pid.to_string(), "/T", "/F"])
        .creation_flags(CREATE_NO_WINDOW)
        .status();
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let token = generate_token();
            let child = spawn_backend(&app.handle(), &token);
            app.manage(BackendProcess(Mutex::new(Some(child))));

            let script = format!("window.__AGENT_TOKEN__ = \"{token}\";");
            WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
                .title("MCP Assistant")
                .inner_size(1000.0, 700.0)
                .initialization_script(&script)
                .build()?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                let state = window.app_handle().state::<BackendProcess>();
                if let Some(mut child) = state.0.lock().unwrap().take() {
                    kill_backend(&mut child);
                };
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
