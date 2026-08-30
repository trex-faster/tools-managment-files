use thiserror::Error;

/// Error genérico de alto nivel. Cada módulo (fs-tools, net-tools, firewall)
/// define su propio enum de error más específico y lo convierte a este
/// cuando necesita cruzar hacia `cli` o hacia la capa de UI.
#[derive(Error, Debug)]
pub enum KitError {
    #[error("permiso denegado: {0}")]
    PermissionDenied(String),

    #[error("recurso no encontrado: {0}")]
    NotFound(String),

    #[error("operación no soportada en este sistema operativo: {0}")]
    Unsupported(String),

    #[error("error interno: {0}")]
    Internal(String),
}
