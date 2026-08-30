//! Metadata de archivos específica de Linux (permisos unix, inode, etc.)
//! TODO: implementar con `std::os::unix::fs::MetadataExt`.
use crate::error::FsError;

pub fn get_permissions(path: &str) -> Result<String, FsError> {
    let _ = path;
    todo!("leer permisos unix (rwxr-xr-x) del archivo")
}
