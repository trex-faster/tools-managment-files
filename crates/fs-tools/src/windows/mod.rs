//! Implementación específica de Windows, dividida por sub-responsabilidad.
//! Cuando esto crezca, cada aspecto (watch, symlinks, etc.) va en su
//! propio archivo aquí, igual que `metadata.rs`.

mod metadata;

pub use metadata::get_permissions;

use crate::error::FsError;

pub fn list_dir(path: &str) -> Result<Vec<String>, FsError> {
    let _ = path;
    todo!("implementar list_dir para Windows")
}
