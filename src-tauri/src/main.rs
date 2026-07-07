#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::os::windows::process::CommandExt;
use std::process::{Child, Command};
use std::sync::Mutex;

use tauri::Manager;

const CREATE_NO_WINDOW: u32 = 0x0800_0000;

struct BackendProcess(Mutex<Option<Child>>);

fn spawn_backend(app: &tauri::AppHandle) -> Child {
    let resource_dir = app
        .path()
        .resource_dir()
        .expect("리소스 디렉터리를 찾을 수 없습니다");
    let exe_path = resource_dir.join("agent-backend").join("agent-backend.exe");
    Command::new(exe_path)
        .creation_flags(CREATE_NO_WINDOW)
        .spawn()
        .expect("agent-backend.exe 실행 실패")
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
            let child = spawn_backend(&app.handle());
            app.manage(BackendProcess(Mutex::new(Some(child))));
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
