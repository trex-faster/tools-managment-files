//! Definición de la interfaz de línea de comandos (clap).
//! Este archivo NO contiene lógica de negocio, solo la forma de los comandos.
//! La lógica real vive en `commands/`.

use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "mikit", about = "Kit de herramientas de sistema")]
pub struct Cli {
    #[command(subcommand)]
    pub command: Commands,

    /// Formato de salida: texto plano o json
    #[arg(long, global = true, default_value = "text")]
    pub output: String,
}

#[derive(Subcommand)]
pub enum Commands {
    /// Muestra qué privilegios tiene el proceso actual
    Caps,
    /// Lista archivos de una carpeta (fs-tools)
    Ls { path: String },
    /// Lista conexiones de red activas (net-tools)
    Conns,
    /// Lista reglas de firewall (firewall)
    Fw,
    /// Extrae uno o varios archivos .zip/.rar de golpe, cada uno a su
    /// propia carpeta. Ej: mikit extract rar1.rar zip2.zip rar2.rar
    Extract { paths: Vec<String> },
}
