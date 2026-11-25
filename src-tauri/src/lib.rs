//! Cloud-Freelife desktop shell.
//!
//! All application logic lives in the web UI. The native side only provides
//! sandboxed capabilities (file access inside the app-data folder, save
//! dialogs, HTTPS requests to GitHub), each limited by `capabilities/default.json`,
//! plus one small command that installs a downloaded update quietly (see `install_update`).

use sha2::{Digest, Sha256};
use tauri::Manager;

mod premium;

const FILE_PREFIX: &str = "Cloud-Freelife_";
const FILE_SUFFIX: &str = "_x64-setup.exe";

fn version_part(s: &str) -> Option<u32> {
    if s.is_empty() || s.len() > 5 || !s.bytes().all(|b| b.is_ascii_digit()) {
        return None;
    }
    s.parse().ok()
}

/// "1.7.0" -> (1, 7, 0). Only plain digits and two dots.
fn parse_version(s: &str) -> Option<(u32, u32, u32)> {
    let mut it = s.split('.');
    let v = (version_part(it.next()?)?, version_part(it.next()?)?, version_part(it.next()?)?);
    if it.next().is_some() {
        return None;
    }
    Some(v)
}

/// The version inside an installer's file name, or None when the name is anything else.
/// Only `Cloud-Freelife_<major>.<minor>.<patch>_x64-setup.exe` is accepted: no paths, no other names.
fn installer_version(name: &str) -> Option<(u32, u32, u32)> {
    parse_version(name.strip_prefix(FILE_PREFIX)?.strip_suffix(FILE_SUFFIX)?)
}

fn valid_sha256(s: &str) -> bool {
    s.len() == 64 && s.bytes().all(|b| b.is_ascii_hexdigit())
}

fn current_version() -> (u32, u32, u32) {
    parse_version(env!("CARGO_PKG_VERSION")).unwrap_or((0, 0, 0))
}

/// True when this copy of the app was put here by the installer (an `uninstall.exe` sits beside it).
/// Only then can an update be installed in place.
fn installed_copy() -> bool {
    std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|d| d.join("uninstall.exe").is_file()))
        .unwrap_or(false)
}

/// Windows wants icon pixels as blue, green, red, alpha; pictures come as red, green, blue, alpha.
fn rgba_to_bgra(rgba: &[u8]) -> Vec<u8> {
    let mut out = Vec::with_capacity(rgba.len());
    for px in rgba.chunks_exact(4) {
        out.extend_from_slice(&[px[2], px[1], px[0], px[3]]);
    }
    out
}

/// Turns a PNG into a Windows icon (32-bit with transparency).
#[cfg(windows)]
fn icon_from_png(png: &[u8]) -> Result<windows_sys::Win32::UI::WindowsAndMessaging::HICON, String> {
    use windows_sys::Win32::UI::WindowsAndMessaging::CreateIcon;
    let img = tauri::image::Image::from_bytes(png).map_err(|_| "The icon picture could not be read.".to_string())?;
    let (w, h) = (img.width(), img.height());
    let rgba = img.rgba();
    if w == 0 || h == 0 || w > 512 || h > 512 || rgba.len() != (w as usize) * (h as usize) * 4 {
        return Err("The icon picture has an unexpected size.".into());
    }
    let bgra = rgba_to_bgra(rgba);
    let mask = vec![0u8; (((w as usize) + 31) / 32) * 4 * (h as usize)];
    // SAFETY: both buffers are alive for the call and sized for a w x h, 32-bit icon.
    let icon = unsafe { CreateIcon(std::ptr::null_mut(), w as i32, h as i32, 1, 32, mask.as_ptr(), bgra.as_ptr()) };
    if icon.is_null() {
        Err("Windows could not make the icon.".into())
    } else {
        Ok(icon)
    }
}

/// Changes the picture on the taskbar button. The page can only change the small icon in the title
/// bar; the taskbar draws the separate large icon, so without this it would keep the original one.
/// Windows only redraws the taskbar button when the small icon is set, so both are set here, large
/// first. The body is the PNG itself.
#[cfg(windows)]
#[tauri::command]
fn set_taskbar_icon(window: tauri::WebviewWindow, request: tauri::ipc::Request<'_>) -> Result<(), String> {
    use windows_sys::Win32::UI::WindowsAndMessaging::{SendMessageW, ICON_BIG, ICON_SMALL, WM_SETICON};
    let tauri::ipc::InvokeBody::Raw(bytes) = request.body() else {
        return Err("No icon was sent.".into());
    };
    if bytes.is_empty() || bytes.len() > 1_000_000 {
        return Err("The icon picture has an unexpected size.".into());
    }
    let icon = icon_from_png(bytes)?;
    let hwnd = window.hwnd().map_err(|_| "The window is not ready.".to_string())?;
    // SAFETY: hwnd is this app's own window and icon is a valid handle made just above.
    unsafe {
        SendMessageW(hwnd.0 as _, WM_SETICON, ICON_BIG as usize, icon as isize);
        SendMessageW(hwnd.0 as _, WM_SETICON, ICON_SMALL as usize, icon as isize);
    }
    Ok(())
}

#[cfg(not(windows))]
#[tauri::command]
fn set_taskbar_icon() -> Result<(), String> {
    Ok(())
}

#[tauri::command]
fn can_self_update() -> bool {
    cfg!(windows) && installed_copy()
}

/// Installs an update that the app has already downloaded and checked, quietly, and restarts the app.
///
/// The installer must be `Cloud-Freelife_<newer version>_x64-setup.exe` in the app's own `update`
/// folder, and its SHA-256 is checked again here, immediately before it runs. It is started with
/// `/S` (no windows), `/UPDATE` (keep everything, same folder) and `/R` (start the app again
/// afterwards). The app closes itself right after starting it; the installer finishes on its own.
#[tauri::command]
fn install_update(app: tauri::AppHandle, file_name: String, sha256: String) -> Result<(), String> {
    let version = installer_version(&file_name).ok_or("That is not a Cloud-Freelife installer.")?;
    if version <= current_version() {
        return Err("That installer is not a newer version.".into());
    }
    if !valid_sha256(&sha256) {
        return Err("The installer's checksum is missing.".into());
    }
    if !can_self_update() {
        return Err("This copy of Cloud-Freelife was not installed with the installer, so it cannot update itself.".into());
    }
    let dir = app
        .path()
        .data_dir()
        .map_err(|e| e.to_string())?
        .join("Cloud-Freelife")
        .join("update");
    let path = dir.join(&file_name);
    let bytes = std::fs::read(&path).map_err(|_| "The downloaded installer could not be read.".to_string())?;
    let got = format!("{:x}", Sha256::digest(&bytes));
    if !got.eq_ignore_ascii_case(&sha256) {
        let _ = std::fs::remove_file(&path);
        return Err("The downloaded installer did not match its checksum, so it was not run.".into());
    }
    drop(bytes);

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        // DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP: the installer keeps going after this app exits.
        std::process::Command::new(&path)
            .args(["/S", "/UPDATE", "/R"])
            .creation_flags(0x0000_0008 | 0x0000_0200)
            .spawn()
            .map_err(|_| "The installer could not be started.".to_string())?;
        app.exit(0);
        Ok(())
    }
    #[cfg(not(windows))]
    {
        Err("Quiet updates are only available on Windows.".into())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![can_self_update, install_update, set_taskbar_icon, premium::premium_check_license, premium::premium_open_pack])
        .run(tauri::generate_context!())
        .expect("error while running Cloud-Freelife");
}

#[cfg(test)]
mod tests {
    #[test]
    fn icon_pixels_are_reordered_to_bgra() {
        assert_eq!(super::rgba_to_bgra(&[1, 2, 3, 4, 10, 20, 30, 40]), vec![3, 2, 1, 4, 30, 20, 10, 40]);
        assert!(super::rgba_to_bgra(&[]).is_empty());
    }

    use super::*;

    #[test]
    fn reads_the_version_from_an_installer_name() {
        assert_eq!(installer_version("Cloud-Freelife_1.7.0_x64-setup.exe"), Some((1, 7, 0)));
        assert_eq!(installer_version("Cloud-Freelife_12.3.45_x64-setup.exe"), Some((12, 3, 45)));
    }

    #[test]
    fn refuses_every_other_name() {
        for bad in [
            "",
            "setup.exe",
            "Cloud-Freelife_1.7.0_x64-setup.exe.bak",
            "cloud-freelife_1.7.0_x64-setup.exe",
            "Cloud-Freelife_1.7_x64-setup.exe",
            "Cloud-Freelife_1.7.0.1_x64-setup.exe",
            "Cloud-Freelife_1.7.x_x64-setup.exe",
            "Cloud-Freelife_+1.7.0_x64-setup.exe",
            "Cloud-Freelife_-1.7.0_x64-setup.exe",
            "Cloud-Freelife_1.7.0_x86-setup.exe",
            "..\\Cloud-Freelife_1.7.0_x64-setup.exe",
            "../Cloud-Freelife_1.7.0_x64-setup.exe",
            "sub/Cloud-Freelife_1.7.0_x64-setup.exe",
            "C:\\Cloud-Freelife_1.7.0_x64-setup.exe",
            "Cloud-Freelife_1234567.7.0_x64-setup.exe",
        ] {
            assert_eq!(installer_version(bad), None, "{bad}");
        }
    }

    #[test]
    fn compares_versions_in_order() {
        assert!((1, 7, 0) > (1, 6, 9));
        assert!((2, 0, 0) > (1, 99, 99));
        assert!(!((1, 6, 0) > (1, 6, 0)));
    }

    #[test]
    fn checks_checksums_are_64_hex_digits() {
        assert!(valid_sha256(&"a".repeat(64)));
        assert!(valid_sha256(&"0123456789abcdefABCDEF".repeat(3)[..64]));
        assert!(!valid_sha256(&"a".repeat(63)));
        assert!(!valid_sha256(&"g".repeat(64)));
        assert!(!valid_sha256(""));
    }

    #[test]
    fn knows_its_own_version() {
        assert!(current_version() > (0, 0, 0));
    }

    #[test]
    fn hashes_like_the_app_does() {
        // SHA-256 of "abc"
        assert_eq!(format!("{:x}", Sha256::digest(b"abc")), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    }
}
