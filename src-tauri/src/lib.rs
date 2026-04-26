use tauri::{
    AppHandle, Manager,
    tray::{TrayIconBuilder, MouseButton, MouseButtonState, TrayIconEvent},
    menu::{Menu, MenuItem},
    image::Image,
};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};
use log::info;
use std::sync::Mutex;

struct PetState {
    position_x: i32,
    position_y: i32,
}

#[tauri::command]
fn save_position(app: AppHandle, x: i32, y: i32) -> Result<(), String> {
    let state = app.state::<Mutex<PetState>>();
    let mut state = state.lock().map_err(|e| e.to_string())?;
    state.position_x = x;
    state.position_y = y;
    info!("Position saved: {}, {}", x, y);
    Ok(())
}

#[tauri::command]
fn load_position(app: AppHandle) -> Result<(i32, i32), String> {
    let state = app.state::<Mutex<PetState>>();
    let state = state.lock().map_err(|e| e.to_string())?;
    Ok((state.position_x, state.position_y))
}

#[tauri::command]
async fn set_autostart(app: AppHandle, enabled: bool) -> Result<(), String> {
    let autolaunch = app.autolaunch();
    if enabled {
        autolaunch.enable().map_err(|e| e.to_string())?;
    } else {
        autolaunch.disable().map_err(|e| e.to_string())?;
    }
    info!("Autostart set to: {}", enabled);
    Ok(())
}

#[tauri::command]
async fn get_autostart(app: AppHandle) -> Result<bool, String> {
    let autolaunch = app.autolaunch();
    autolaunch.is_enabled().map_err(|e| e.to_string())
}

#[tauri::command]
fn show_window(app: AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

#[tauri::command]
fn hide_window(app: AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
    }
}

fn setup_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let show_i = MenuItem::with_id(app, "show", "显示", true, None::<&str>)?;
    let hide_i = MenuItem::with_id(app, "hide", "隐藏", true, None::<&str>)?;

    // 获取当前自启状态
    let autolaunch = app.autolaunch();
    let is_enabled = autolaunch.is_enabled().unwrap_or(false);
    let autostart_text = if is_enabled { "开机自启 ✓" } else { "开机自启" };
    let autostart_i = MenuItem::with_id(app, "autostart", autostart_text, true, None::<&str>)?;

    let quit_i = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&show_i, &hide_i, &autostart_i, &quit_i])?;

    let icon_bytes = include_bytes!("../icons/icon.png");
    let icon = Image::from_bytes(icon_bytes)?;

    let _tray = TrayIconBuilder::new()
        .icon(icon)
        .id("main-tray")
        .menu(&menu)
        .tooltip("DeskPet - 多啦A梦")
        .on_menu_event(|app, event| {
            match event.id.as_ref() {
                "show" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "hide" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.hide();
                    }
                }
                "autostart" => {
                    let autolaunch = app.autolaunch();
                    let is_enabled = autolaunch.is_enabled().unwrap_or(false);
                    if is_enabled {
                        let _ = autolaunch.disable();
                        info!("Autostart disabled");
                    } else {
                        let _ = autolaunch.enable();
                        info!("Autostart enabled");
                    }
                    // 重新创建托盘以刷新菜单状态
                    if let Some(tray) = app.tray_by_id("main-tray") {
                        let _ = tray.destroy();
                    }
                    let _ = setup_tray(app);
                }
                "quit" => {
                    app.exit(0);
                }
                _ => {}
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    if window.is_visible().unwrap_or(false) {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
        })
        .build(app)?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .manage(Mutex::new(PetState { position_x: 100, position_y: 100 }))
        .setup(|app| {
            info!("DeskPet starting...");

            // 配置窗口无边框
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_decorations(false);
            }

            // 不再默认开启开机自启，让用户自己选择
            // let autolaunch = app.autolaunch();
            // let _ = autolaunch.enable();

            // 创建系统托盘
            setup_tray(app.handle())?;

            info!("DeskPet initialized successfully");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            save_position,
            load_position,
            set_autostart,
            get_autostart,
            show_window,
            hide_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}