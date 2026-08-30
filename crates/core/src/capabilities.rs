//! Detecta con qué privilegios corre el proceso, para que cada módulo
//! pueda desactivar features en vez de fallar a medias.
//! TODO: implementar la detección real por plataforma (windows.rs / linux.rs).

#[derive(Debug, Clone, Copy, Default)]
pub struct Capabilities {
    pub is_elevated: bool,          // admin en Windows / root o sudo en Linux
    pub can_modify_firewall: bool,
    pub can_read_system_files: bool,
    pub can_open_raw_sockets: bool,
}

impl Capabilities {
    /// Punto de entrada único. La lógica real por SO va detrás de cfg().
    pub fn detect() -> Self {
        #[cfg(target_os = "windows")]
        {
            Self::detect_windows()
        }
        #[cfg(target_os = "linux")]
        {
            Self::detect_linux()
        }
        #[cfg(not(any(target_os = "windows", target_os = "linux")))]
        {
            Self::default()
        }
    }

    #[cfg(target_os = "windows")]
    fn detect_windows() -> Self {
        // TODO: usar windows-rs para chequear el token de admin real.
        Self::default()
    }

    #[cfg(target_os = "linux")]
    fn detect_linux() -> Self {
        // TODO: chequear euid == 0 o capabilities (CAP_NET_ADMIN, etc.)
        Self::default()
    }
}
