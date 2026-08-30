//! Provee la ruta a un binario que sepa extraer .rar (7z, unrar o el
//! Rar.exe de línea de comandos que trae WinRAR). Si no existe ninguno
//! instalado, descarga e instala 7-Zip automáticamente (es LGPL/freeware,
//! legal de redistribuir e instalar en modo silencioso). WinRAR NO se
//! auto-instala: es shareware comercial, requiere aceptación explícita
//! del usuario.

use crate::error::ArchiveError;
use std::path::PathBuf;
use std::process::Command;

#[cfg(target_os = "windows")]
mod windows;
#[cfg(target_os = "linux")]
mod linux;

/// Busca una herramienta ya instalada y accesible en el PATH del sistema.
fn find_in_path() -> Option<PathBuf> {
    for tool in ["unrar", "7z", "7za", "7zr"] {
        if Command::new(tool).arg("-h").output().is_ok() {
            return Some(PathBuf::from(tool));
        }
    }
    None
}

/// Muchos usuarios tienen 7-Zip/WinRAR instalados pero NUNCA agregados
/// al PATH (el instalador de 7-Zip no lo hace por defecto, y WinRAR
/// tampoco). Por eso, además del PATH, revisamos las rutas típicas
/// donde Windows los instala.
#[cfg(target_os = "windows")]
fn find_in_known_windows_paths() -> Option<PathBuf> {
    let candidates = [
        r"C:\Program Files\7-Zip\7z.exe",
        r"C:\Program Files (x86)\7-Zip\7z.exe",
        r"C:\Program Files\WinRAR\Rar.exe",
        r"C:\Program Files (x86)\WinRAR\Rar.exe",
        r"C:\Program Files\WinRAR\UnRAR.exe",
        r"C:\Program Files (x86)\WinRAR\UnRAR.exe",
    ];

    candidates
        .iter()
        .map(PathBuf::from)
        .find(|p| p.exists())
}

/// Devuelve la ruta a un binario utilizable para extraer .rar.
/// Si no hay nada instalado (ni en PATH ni en rutas conocidas de
/// Windows), intenta instalar 7-Zip automáticamente.
pub fn ensure_tool() -> Result<PathBuf, ArchiveError> {
    if let Some(path) = find_in_path() {
        return Ok(path);
    }

    #[cfg(target_os = "windows")]
    if let Some(path) = find_in_known_windows_paths() {
        tracing::info!("herramienta encontrada fuera del PATH: {}", path.display());
        return Ok(path);
    }

    tracing::info!("no se encontró unrar/7z/WinRAR, intentando instalar 7-Zip automáticamente...");

    #[cfg(target_os = "windows")]
    return windows::install_7zip();

    #[cfg(target_os = "linux")]
    return linux::install_7zip();

    #[cfg(not(any(target_os = "windows", target_os = "linux")))]
    Err(ArchiveError::ToolNotFound(
        "instalación automática no soportada en este sistema operativo".into(),
    ))
}