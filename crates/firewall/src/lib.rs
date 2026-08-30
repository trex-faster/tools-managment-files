//! firewall: lectura/modificación de reglas de firewall.
//! Requiere privilegios elevados (admin en Windows, root/CAP_NET_ADMIN en Linux).
//! Este es el módulo más delicado del kit: implementar al final.

pub mod error;

#[cfg(target_os = "windows")]
mod windows;
#[cfg(target_os = "linux")]
mod linux;

pub use error::FirewallError;

/// Ejemplo de función pública: lista reglas actuales.
pub fn list_rules() -> Result<Vec<String>, FirewallError> {
    #[cfg(target_os = "windows")]
    return windows::list_rules();

    #[cfg(target_os = "linux")]
    return linux::list_rules();

    #[cfg(not(any(target_os = "windows", target_os = "linux")))]
    Err(FirewallError::Unsupported("SO no soportado".into()))
}
