//! archive-tools: extracción de archivos comprimidos (.zip, .rar, ...)
//! uno por uno o en lote. Este es el crate que resuelve el problema de
//! "seleccioné 50 archivos y el explorador solo descomprime el primero".

pub mod error;
mod formats;

pub use error::ArchiveError;
use formats::Format;
use std::path::{Path, PathBuf};

/// Resultado de intentar extraer UN archivo dentro de un lote.
/// No usamos `Result` para el batch completo a propósito: si el archivo
/// 30 de 50 falla, los otros 49 deben seguir procesándose igual.
#[derive(Debug)]
pub struct ExtractOutcome {
    pub archive: PathBuf,
    pub dest: PathBuf,
    pub result: Result<(), ArchiveError>,
}

/// Extrae un solo archivo a la carpeta indicada.
pub fn extract_one(archive_path: &Path, dest_dir: &Path) -> Result<(), ArchiveError> {
    let format = Format::from_path(archive_path)?;
    match format {
        Format::Zip => formats::zip::extract(archive_path, dest_dir),
        Format::Rar => formats::rar::extract(archive_path, dest_dir),
    }
}

/// Extrae varios archivos de golpe. Cada uno va a una carpeta con su
/// mismo nombre (sin extensión), al lado del archivo original.
/// Un archivo que falla NO detiene a los demás.
pub fn batch_extract(archive_paths: &[PathBuf]) -> Vec<ExtractOutcome> {
    archive_paths
        .iter()
        .map(|archive| {
            let dest = dest_folder_for(archive);
            let result = extract_one(archive, &dest);
            ExtractOutcome {
                archive: archive.clone(),
                dest,
                result,
            }
        })
        .collect()
}

/// Calcula la carpeta destino: mismo directorio, nombre sin extensión.
/// ej: /descargas/rar1.rar -> /descargas/rar1/
fn dest_folder_for(archive_path: &Path) -> PathBuf {
    let parent = archive_path.parent().unwrap_or_else(|| Path::new("."));
    let stem = archive_path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("extraido");
    parent.join(stem)
}
