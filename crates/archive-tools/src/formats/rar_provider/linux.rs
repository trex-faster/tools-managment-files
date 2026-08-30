//! En Linux NO se descarga un binario suelto de internet: se usa el
//! gestor de paquetes del sistema, que es la forma correcta y segura
//! de instalar software (firmas verificadas, actualizaciones futuras
//! manejadas por el propio sistema). Requiere privilegios de sudo/root.

use crate::error::ArchiveError;
use std::path::PathBuf;
use std::process::Command;

struct PackageManager {
    check_cmd: &'static str,
    install_cmd: &'static [&'static str],
    binary_name: &'static str,
}

const MANAGERS: &[PackageManager] = &[
    PackageManager {
        check_cmd: "apt-get",
        install_cmd: &["apt-get", "install", "-y", "unrar"],
        binary_name: "unrar",
    },
    PackageManager {
        check_cmd: "dnf",
        install_cmd: &["dnf", "install", "-y", "unrar"],
        binary_name: "unrar",
    },
    PackageManager {
        check_cmd: "pacman",
        install_cmd: &["pacman", "-S", "--noconfirm", "unrar"],
        binary_name: "unrar",
    },
];

pub fn install_7zip() -> Result<PathBuf, ArchiveError> {
    let manager = MANAGERS
        .iter()
        .find(|m| Command::new("which").arg(m.check_cmd).output().map(|o| o.status.success()).unwrap_or(false))
        .ok_or_else(|| {
            ArchiveError::ToolNotFound(
                "no se detectó apt/dnf/pacman. Instala p7zip manualmente".into(),
            )
        })?;

    tracing::info!("instalando p7zip con {}...", manager.check_cmd);

    let is_root = std::env::var("USER").map(|u| u == "root").unwrap_or(false)
        || Command::new("id").arg("-u").output()
            .map(|o| String::from_utf8_lossy(&o.stdout).trim() == "0")
            .unwrap_or(false);

    let status = if is_root {
        Command::new(manager.install_cmd[0])
            .args(&manager.install_cmd[1..])
            .status()
    } else {
        Command::new("sudo").args(manager.install_cmd).status()
    }
    .map_err(|e| ArchiveError::ToolNotFound(format!("no se pudo ejecutar la instalación: {e}")))?;

    if !status.success() {
        return Err(ArchiveError::ToolNotFound(format!(
            "la instalación de p7zip falló (código {status}). \
             Puede requerir contraseña de sudo interactiva."
        )));
    }

    Ok(PathBuf::from(manager.binary_name))
}
