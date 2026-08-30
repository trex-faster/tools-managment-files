//! Configuración persistente del usuario (ej. ~/.mikit/config.toml
//! en Linux, %APPDATA%\mikit\config.toml en Windows).
//! TODO: implementar lectura/escritura real con `serde` + `toml`.

#[derive(Debug, Default)]
pub struct Config {
    pub default_output: String,
}

impl Config {
    /// Carga la config desde disco, o devuelve default si no existe.
    pub fn load() -> Self {
        // TODO: leer archivo real según plataforma
        Self::default()
    }
}
