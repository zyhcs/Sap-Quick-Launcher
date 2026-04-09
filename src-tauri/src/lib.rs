use tauri::{
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
};
use tauri::Theme;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

// ==================== Tauri Commands ====================

#[tauri::command]
fn launch_sap(
    sap_path: String,
    user: String,
    password: String,
    language: String,
    system: String,
    client: String,
    sysname: String,
) -> Result<(), String> {
    use std::process::Command;

    log::info!(
        "Launching SAP: {} -user={} -system={} -client={}",
        sap_path,
        user,
        system,
        client
    );

    #[cfg(target_os = "windows")]
    {
        let args = vec![
            format!("-user={}", user),
            format!("-pw={}", password),
            format!("-language={}", language),
            format!("-system={}", system),
            format!("-client={}", client),
            format!("-sysname={}", sysname),
            "-maxgui".to_string(),
        ];

        Command::new(&sap_path)
            .args(&args)
            .spawn()
            .map_err(|e| format!("Failed to start SAP GUI: {}", e))?;
    }

    #[cfg(not(target_os = "windows"))]
    {
        let cmd = format!(
            "\"{}\" -user=\"{}\" -pw=\"{}\" -language={} -SYSTEM={} -CLIENT={} -sysname=\"{}\" -maxgui",
            sap_path, user, password, language, system, client, sysname
        );
        Command::new("sh")
            .arg("-c")
            .arg(&cmd)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
fn export_connections(path: String, data: String) -> Result<(), String> {
    use std::fs;
    log::info!("Exporting connections to: {}", path);
    fs::write(&path, &data).map_err(|e| format!("Failed to export: {}", e))?;
    Ok(())
}

#[tauri::command]
fn import_connections(path: String) -> Result<String, String> {
    use std::fs;
    log::info!("Importing connections from: {}", path);
    let data = fs::read_to_string(&path).map_err(|e| format!("Failed to import: {}", e))?;
    Ok(data)
}

#[tauri::command]
fn set_window_theme(app: tauri::AppHandle, theme: String) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        let theme = match theme.as_str() {
            "dark" => Theme::Dark,
            "light" => Theme::Light,
            _ => Theme::Dark,
        };
        window.set_theme(Some(theme)).map_err(|e| e.to_string())?;
        log::info!("Window theme changed to: {}", theme);
    }
    Ok(())
}

// 保存快捷键配置到文件
#[tauri::command]
fn save_hotkey_config(hotkey: String) -> Result<(), String> {
    use std::fs;
    use std::path::PathBuf;

    // 获取应用数据目录
    let config_dir = dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("sap-quick-launcher");

    // 确保目录存在
    fs::create_dir_all(&config_dir).map_err(|e| format!("Failed to create config dir: {}", e))?;

    let config_path = config_dir.join("hotkey.json");
    let config_data = serde_json::json!({ "hotkey": hotkey });

    fs::write(&config_path, config_data.to_string())
        .map_err(|e| format!("Failed to save hotkey config: {}", e))?;

    log::info!("Hotkey config saved: {}", hotkey);
    Ok(())
}

// 验证快捷键是否可以注册（检测冲突）
#[tauri::command]
fn check_hotkey_available(app: tauri::AppHandle, hotkey: String) -> Result<bool, String> {
    let (modifiers, code) = parse_hotkey_string(&hotkey);
    let shortcut = Shortcut::new(modifiers, code);
    
    // 尝试注册一个临时快捷键来检测是否冲突
    // 如果注册失败，说明快捷键被占用
    let _test_id = format!("test_{}", hotkey.replace("+", "_"));
    
    // 先检查当前是否已注册
    let global_shortcut = app.global_shortcut();
    
    // 尝试注册
    let result = global_shortcut.register(shortcut);
    
    match result {
        Ok(_) => {
            // 注册成功，立即注销（这只是测试）
            let _ = global_shortcut.unregister(shortcut);
            log::info!("Hotkey {} is available", hotkey);
            Ok(true)
        }
        Err(e) => {
            log::warn!("Hotkey {} is not available: {}", hotkey, e);
            Ok(false)
        }
    }
}

// 重启应用
#[tauri::command]
fn restart_app(app: tauri::AppHandle) -> Result<(), String> {
    use std::process::Command;
    
    // 获取当前可执行文件路径
    let exe_path = std::env::current_exe()
        .map_err(|e| format!("Failed to get exe path: {}", e))?;
    
    log::info!("Restarting app from: {:?}", exe_path);
    
    // 启动新进程
    Command::new(&exe_path)
        .spawn()
        .map_err(|e| format!("Failed to spawn new process: {}", e))?;
    
    // 退出当前进程
    app.exit(0);
    
    Ok(())
}

// 读取快捷键配置
fn load_hotkey_config() -> String {
    use std::fs;
    use std::path::PathBuf;

    let config_path = dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("sap-quick-launcher")
        .join("hotkey.json");

    if let Ok(data) = fs::read_to_string(&config_path) {
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&data) {
            if let Some(hotkey) = json.get("hotkey").and_then(|v| v.as_str()) {
                return hotkey.to_string();
            }
        }
    }

    "Ctrl+Shift+Space".to_string()
}

// 创建系统托盘（带错误处理）
fn create_system_tray(app: &tauri::App, hotkey: &str) -> Result<(), String> {
    let tray_menu = tauri::menu::MenuBuilder::new(app)
        .text("show", "Show Window")
        .separator()
        .text("quit", "Quit")
        .build()
        .map_err(|e| format!("Failed to build tray menu: {}", e))?;

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&tray_menu)
        .tooltip(&format!("SAP Quick Launcher - {} to toggle", hotkey))
        .on_menu_event(|app, event| {
            match event.id().as_ref() {
                "show" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "quit" => {
                    app.exit(0);
                }
                _ => {}
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)
        .map_err(|e| format!("Failed to build tray: {}", e))?;

    Ok(())
}

// 注册全局快捷键（带错误处理）
fn register_global_shortcut(app: &tauri::App, hotkey: &str) -> Result<(), String> {
    let (modifiers, code) = parse_hotkey_string(hotkey);
    let shortcut = Shortcut::new(modifiers, code);
    let app_handle = app.handle().clone();
    let hotkey_for_log = hotkey.to_string();

    app.global_shortcut()
        .on_shortcut(shortcut, move |_app, _shortcut, event| {
            if event.state == ShortcutState::Pressed {
                log::info!("Global shortcut triggered: {}", hotkey_for_log);
                if let Some(window) = app_handle.get_webview_window("main") {
                    if window.is_visible().unwrap_or(false) {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
        })
        .map_err(|e| format!("Failed to register shortcut: {}", e))?;

    Ok(())
}

// 解析快捷键字符串为 Modifiers 和 Code
fn parse_hotkey_string(hotkey: &str) -> (Option<Modifiers>, Code) {
    use tauri_plugin_global_shortcut::Code;

    let parts: Vec<&str> = hotkey.split('+').collect();
    let mut modifiers = Modifiers::empty();

    let mut code = Code::Space; // 默认值

    for part in &parts {
        match part.to_uppercase().as_str() {
            "CTRL" | "CONTROL" => modifiers |= Modifiers::CONTROL,
            "SHIFT" => modifiers |= Modifiers::SHIFT,
            "ALT" => modifiers |= Modifiers::ALT,
            "META" | "WIN" | "CMD" | "COMMAND" => modifiers |= Modifiers::META,
            // 按键映射
            "SPACE" => code = Code::Space,
            "ENTER" => code = Code::Enter,
            "TAB" => code = Code::Tab,
            "ESC" | "ESCAPE" => code = Code::Escape,
            "BACKSPACE" => code = Code::Backspace,
            "DELETE" => code = Code::Delete,
            "UP" => code = Code::ArrowUp,
            "DOWN" => code = Code::ArrowDown,
            "LEFT" => code = Code::ArrowLeft,
            "RIGHT" => code = Code::ArrowRight,
            "HOME" => code = Code::Home,
            "END" => code = Code::End,
            "PAGEUP" => code = Code::PageUp,
            "PAGEDOWN" => code = Code::PageDown,
            "F1" => code = Code::F1,
            "F2" => code = Code::F2,
            "F3" => code = Code::F3,
            "F4" => code = Code::F4,
            "F5" => code = Code::F5,
            "F6" => code = Code::F6,
            "F7" => code = Code::F7,
            "F8" => code = Code::F8,
            "F9" => code = Code::F9,
            "F10" => code = Code::F10,
            "F11" => code = Code::F11,
            "F12" => code = Code::F12,
            _ => {
                // 假设是单个字符按键
                if part.len() == 1 {
                    // 尝试将字符转换为代码
                    code = match part.to_uppercase().as_str() {
                        "A" => Code::KeyA,
                        "B" => Code::KeyB,
                        "C" => Code::KeyC,
                        "D" => Code::KeyD,
                        "E" => Code::KeyE,
                        "F" => Code::KeyF,
                        "G" => Code::KeyG,
                        "H" => Code::KeyH,
                        "I" => Code::KeyI,
                        "J" => Code::KeyJ,
                        "K" => Code::KeyK,
                        "L" => Code::KeyL,
                        "M" => Code::KeyM,
                        "N" => Code::KeyN,
                        "O" => Code::KeyO,
                        "P" => Code::KeyP,
                        "Q" => Code::KeyQ,
                        "R" => Code::KeyR,
                        "S" => Code::KeyS,
                        "T" => Code::KeyT,
                        "U" => Code::KeyU,
                        "V" => Code::KeyV,
                        "W" => Code::KeyW,
                        "X" => Code::KeyX,
                        "Y" => Code::KeyY,
                        "Z" => Code::KeyZ,
                        "0" => Code::Digit0,
                        "1" => Code::Digit1,
                        "2" => Code::Digit2,
                        "3" => Code::Digit3,
                        "4" => Code::Digit4,
                        "5" => Code::Digit5,
                        "6" => Code::Digit6,
                        "7" => Code::Digit7,
                        "8" => Code::Digit8,
                        "9" => Code::Digit9,
                        _ => Code::Space,
                    };
                }
            }
        }
    }

    (Some(modifiers), code)
}

pub fn run() {
    env_logger::init();
    log::info!("Starting SAP Quick Launcher");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // 当另一个实例试图启动时，显示当前实例的窗口
            log::info!("Another instance attempted to start, focusing existing window");
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .invoke_handler(tauri::generate_handler![
            launch_sap, export_connections, import_connections,
            set_window_theme, save_hotkey_config,
            check_hotkey_available, restart_app
        ])
        .setup(|app| {
            log::info!("App setup starting");

            // 先读取快捷键配置
            let hotkey = load_hotkey_config();
            log::info!("Loading hotkey config: {}", hotkey);

            // Set default theme to dark
            if let Some(window) = app.get_webview_window("main") {
                log::info!("Setting dark theme");
                window.set_theme(Some(Theme::Dark)).ok();
            } else {
                log::warn!("Could not get main window");
            }

            // Create system tray (with error handling)
            log::info!("Creating system tray");
            let tray_result = create_system_tray(app, &hotkey);
            if let Err(e) = &tray_result {
                log::error!("Failed to create system tray: {}", e);
            } else {
                log::info!("System tray created successfully");
            }

            // 注册全局快捷键 (with error handling)
            log::info!("Registering global shortcut: {}", hotkey);
            let shortcut_result = register_global_shortcut(app, &hotkey);
            if let Err(e) = &shortcut_result {
                log::error!("Failed to register global shortcut: {}", e);
            } else {
                log::info!("Global shortcut registered successfully");
            }

            // Handle window close - hide instead of close
            if let Some(window) = app.get_webview_window("main") {
                let window_clone = window.clone();
                window.on_window_event(move |event| {
                    if let WindowEvent::CloseRequested { api, .. } = event {
                        // Hide window instead of closing
                        let _ = window_clone.hide();
                        api.prevent_close();
                        log::info!("Window hidden to tray");
                    }
                });
            }

            log::info!("App setup complete");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}