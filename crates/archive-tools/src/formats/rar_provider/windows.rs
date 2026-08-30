//! Descarga el instalador oficial de 7-Zip desde 7-zip.org y lo corre
//! en modo silencioso (/S). El instalador de 7-Zip soporta esto de
//! forma oficial, no es un hack.

use crate::error::ArchiveError;
use std::io::Read;
use std::path::{Path, PathBuf};

const DOWNLOAD_PAGE: &str = "https://www.7-zip.org/download.html";
/// Fallback por si el scraping de la página falla: una versión conocida
/// y estable. Se actualiza de vez en cuando a mano.
const FALLBACK_URL: &str = "https://www.7-zip.org/a/7z2408-x64.exe";

/// Ruta donde queda instalado 7-Zip por defecto en Windows.
fn default_install_path() -> PathBuf {
    PathBuf::from(r"C:\Program Files\7-Zip\7z.exe")
}

/// Intenta encontrar el link del instalador de 64 bits en la página
/// oficial de descargas. Si falla por cualquier motivo, cae al fallback.
fn find_latest_installer_url() -> String {
    let html = match ureq::get(DOWNLOAD_PAGE).call() {
        Ok(resp) => match resp.into_string() {
            Ok(s) => s,
            Err(_) => return FALLBACK_URL.to_string(),
        },
        Err(_) => return FALLBACK_URL.to_string(),
    };

    let re = match regex::Regex::new(r"a/7z\d+-x64\.exe") {
        Ok(r) => r,
        Err(_) => return FALLBACK_URL.to_string(),
    };

    match re.find(&html) {
        Some(m) => format!("https://www.7-zip.org/{}", m.as_str()),
        None => FALLBACK_URL.to_string(),
    }
}

pub fn install_7zip() -> Result<PathBuf, ArchiveError> {
    let url = find_latest_installer_url();
    tracing::info!("descargando instalador de 7-Zip desde {url}");

    let response = ureq::get(&url)
        .call()
        .map_err(|e| ArchiveError::ToolNotFound(format!("no se pudo descargar 7-Zip: {e}")))?;

    let mut bytes: Vec<u8> = Vec::new();
    response
        .into_reader()
        .read_to_end(&mut bytes)
        .map_err(|e| ArchiveError::ToolNotFound(format!("descarga incompleta: {e}")))?;

    let temp_dir = std::env::temp_dir();
    let installer_path: PathBuf = temp_dir.join("mikit_7zip_installer.exe");
    std::fs::write(&installer_path, &bytes)?;

    tracing::info!("instalando 7-Zip en modo silencioso...");
    run_silent_installer(&installer_path)?;

    let installed = default_install_path();
    if installed.exists() {
        Ok(installed)
    } else {
        Err(ArchiveError::ToolNotFound(
            "el instalador corrió pero no se encontró 7z.exe en la ruta esperada".into(),
        ))
    }
}

fn run_silent_installer(installer_path: &Path) -> Result<(), ArchiveError> {
    // El instalador oficial de 7-Zip acepta /S para instalación silenciosa,
    // sin diálogos ni intervención del usuario.
    let status = std::process::Command::new(installer_path)
        .arg("/S")
        .status()
        .map_err(|e| ArchiveError::ToolNotFound(format!("no se pudo ejecutar el instalador: {e}")))?;

    if !status.success() {
        return Err(ArchiveError::ToolNotFound(format!(
            "el instalador de 7-Zip devolvió código {status}"
        )));
    }
    Ok(())
}
