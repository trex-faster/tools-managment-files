//! fs-tools: operaciones sobre archivos y carpetas.
//! Este módulo NO depende de net-tools ni firewall. Solo de mikit-core.

pub mod error;

#[cfg(target_os = "windows")]
mod windows;
#[cfg(target_os = "linux")]
mod linux;

pub use error::FsError;

/// Ejemplo de función pública: el resto del kit llama esto sin
/// preocuparse de en qué SO está corriendo.
pub fn list_dir(path: &str) -> Result<Vec<String>, FsError> {
    #[cfg(target_os = "windows")]
    return windows::list_dir(path);

    #[cfg(target_os = "linux")]
    return linux::list_dir(path);

    #[cfg(not(any(target_os = "windows", target_os = "linux")))]
    {
        let _ = path;
        Err(FsError::Unsupported("SO no soportado".into()))
    }
}
