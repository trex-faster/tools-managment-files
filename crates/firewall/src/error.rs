use thiserror::Error;

#[derive(Error, Debug)]
pub enum FirewallError {
    #[error("se requieren privilegios elevados (admin/root) para esta operación")]
    NotElevated,

    #[error("regla no encontrada: {0}")]
    RuleNotFound(String),

    #[error("operación no soportada: {0}")]
    Unsupported(String),
}
