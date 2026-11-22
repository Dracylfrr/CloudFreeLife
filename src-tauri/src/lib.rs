//! Cloud-Freelife desktop shell.
//!
//! All application logic lives in the web UI. The native side only provides
//! sandboxed capabilities (file access inside the app-data folder, save
//! dialogs, opening official GitHub links, and HTTPS requests to GitHub),
//! each limited by `capabilities/default.json`.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .run(tauri::generate_context!())
        .expect("error while running Cloud-Freelife");
}
