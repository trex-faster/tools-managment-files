use std::path::PathBuf;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ArchiveError {
    #[error("formato de archivo no reconocido: {0}")]
    UnknownFormat(String),

    #[error("no se pudo abrir '{0}': {1}")]
    OpenFailed(PathBuf, String),

    #[error("error al extraer '{0}': {1}")]
    ExtractFailed(PathBuf, String),

    #[error("herramienta externa requerida no encontrada: {0}")]
    ToolNotFound(String),

    #[error("error de entrada/salida: {0}")]
    Io(#[from] std::io::Error),
}
