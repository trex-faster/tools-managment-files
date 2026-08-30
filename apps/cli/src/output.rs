//! Formato de salida de los comandos. Centralizado aquí para que
//! cada comando en `commands/` no reimplemente su propio formato.
//! TODO: implementar el modo "json" de verdad con `serde_json`.

pub enum OutputFormat {
    Text,
    Json,
}

impl From<&str> for OutputFormat {
    fn from(s: &str) -> Self {
        match s {
            "json" => OutputFormat::Json,
            _ => OutputFormat::Text,
        }
    }
}

/// Imprime una lista de líneas en el formato pedido.
pub fn print_list(items: &[String], format: &OutputFormat) {
    match format {
        OutputFormat::Text => {
            for item in items {
                println!("{item}");
            }
        }
        OutputFormat::Json => {
            todo!("serializar a JSON con serde_json")
        }
    }
}

/// Imprime un error de forma consistente en todos los comandos.
pub fn print_error(err: impl std::fmt::Display) {
    eprintln!("error: {err}");
}
