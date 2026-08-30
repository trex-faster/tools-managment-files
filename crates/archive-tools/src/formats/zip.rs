//! Extracción de archivos .zip usando el crate `zip` (puro Rust,
//! funciona igual en Windows y Linux, sin depender de herramientas externas).

use crate::error::ArchiveError;
use std::fs;
use std::path::Path;

pub fn extract(archive_path: &Path, dest_dir: &Path) -> Result<(), ArchiveError> {
    let file = fs::File::open(archive_path)
        .map_err(|e| ArchiveError::OpenFailed(archive_path.to_path_buf(), e.to_string()))?;

    let mut zip = zip::ZipArchive::new(file)
        .map_err(|e| ArchiveError::OpenFailed(archive_path.to_path_buf(), e.to_string()))?;

    for i in 0..zip.len() {
        let mut entry = zip
            .by_index(i)
            .map_err(|e| ArchiveError::ExtractFailed(archive_path.to_path_buf(), e.to_string()))?;

        let out_path = match entry.enclosed_name() {
            Some(name) => dest_dir.join(name),
            None => continue, // entrada con path inseguro (zip-slip); se ignora
        };

        if entry.is_dir() {
            fs::create_dir_all(&out_path)?;
        } else {
            if let Some(parent) = out_path.parent() {
                fs::create_dir_all(parent)?;
            }
            let mut out_file = fs::File::create(&out_path)?;
            std::io::copy(&mut entry, &mut out_file)?;
        }
    }

    Ok(())
}
