use thiserror::Error;

#[derive(Error, Debug)]
pub enum NetError {
    #[error("permiso denegado: {0}")]
    PermissionDenied(String),

    #[error("no se pudo abrir el socket: {0}")]
    SocketError(String),

    #[error("operación no soportada: {0}")]
    Unsupported(String),
}
