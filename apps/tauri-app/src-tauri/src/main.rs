#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;

#[derive(Serialize)]
struct ExtractOutcomeDto {
    archive: String,
    dest: String,
    ok: bool,
    error: Option<String>,
}

#[tauri::command]
fn batch_extract(paths: Vec<String>) -> Vec<ExtractOutcomeDto> {
    let path_bufs: Vec<std::path::PathBuf> = paths.into_iter().map(Into::into).collect();

    archive_tools::batch_extract(&path_bufs)
        .into_iter()
        .map(|outcome| ExtractOutcomeDto {
            archive: outcome.archive.display().to_string(),
            dest: outcome.dest.display().to_string(),
            ok: outcome.result.is_ok(),
            error: outcome.result.err().map(|e| e.to_string()),
        })
        .collect()
}

#[tauri::command]
fn get_capabilities() -> serde_json::Value {
    let caps = mikit_core::Capabilities::detect();
    serde_json::json!({
        "is_elevated": caps.is_elevated,
        "can_modify_firewall": caps.can_modify_firewall,
        "can_read_system_files": caps.can_read_system_files,
        "can_open_raw_sockets": caps.can_open_raw_sockets,
    })
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![batch_extract, get_capabilities])
        .run(tauri::generate_context!())
        .expect("error corriendo la app de Tauri");
}