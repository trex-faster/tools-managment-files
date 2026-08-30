//! net-tools: operaciones de red (conexiones, sockets, interfaces, etc.)
//! Este módulo NO depende de fs-tools ni firewall. Solo de mikit-core.

pub mod error;

#[cfg(target_os = "windows")]
mod windows;
#[cfg(target_os = "linux")]
mod linux;

pub use error::NetError;

/// Ejemplo de función pública: lista conexiones activas.
pub fn list_connections() -> Result<Vec<String>, NetError> {
    #[cfg(target_os = "windows")]
    return windows::list_connections();

    #[cfg(target_os = "linux")]
    return linux::list_connections();

    #[cfg(not(any(target_os = "windows", target_os = "linux")))]
    Err(NetError::Unsupported("SO no soportado".into()))
}
