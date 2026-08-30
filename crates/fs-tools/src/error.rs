use thiserror::Error;

#[derive(Error, Debug)]
pub enum FsError {
    #[error("permiso denegado: {0}")]
    PermissionDenied(String),

    #[error("archivo o carpeta no encontrada: {0}")]
    NotFound(String),

    #[error("operación no soportada: {0}")]
    Unsupported(String),
}
