//! Extracción de .rar. El formato RAR es propietario: no existe una
//! librería pura en Rust para descomprimirlo legalmente sin licencia.
//! Por eso delegamos a una herramienta externa. Si no está instalada,
//! `rar_provider::ensure_tool()` intenta instalarla automáticamente
//! (7-Zip en Windows, p7zip vía gestor de paquetes en Linux).

use crate::error::ArchiveError;
use crate::formats::rar_provider;
use std::path::{Path, PathBuf};
use std::process::Command;

pub fn extract(archive_path: &Path, dest_dir: &Path) -> Result<(), ArchiveError> {
    let tool_path: PathBuf = rar_provider::ensure_tool()?;
    let tool_name = tool_path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("");

    std::fs::create_dir_all(dest_dir)?;

    let status = if tool_name.eq_ignore_ascii_case("unrar") || tool_name.eq_ignore_ascii_case("rar") {
        // unrar y Rar.exe (WinRAR) usan la misma sintaxis de línea de comandos.
        Command::new(&tool_path)
            .args(["x", "-y"])
            .arg(archive_path)
            .arg(dest_dir)
            .status()
    } else {
        // 7z / 7za / 7zr
        Command::new(&tool_path)
            .arg("x")
            .arg(archive_path)
            .arg(format!("-o{}", dest_dir.display()))
            .arg("-y")
            .status()
    }
    .map_err(|e| ArchiveError::ExtractFailed(archive_path.to_path_buf(), e.to_string()))?;

    if !status.success() {
        return Err(ArchiveError::ExtractFailed(
            archive_path.to_path_buf(),
            format!("{tool_name} devolvió código de error {status}"),
        ));
    }

    Ok(())
}