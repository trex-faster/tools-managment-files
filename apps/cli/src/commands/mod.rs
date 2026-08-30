//! Enrutador de comandos. Cada variante de `Commands` (definida en cli.rs)
//! se despacha a su propio módulo aquí abajo. Ningún comando conoce a
//! los otros — cada uno es independiente y solo usa `core`/`output`.

mod caps;
mod conns;
mod extract;
mod fw;
mod ls;

use crate::cli::Commands;
use crate::output::OutputFormat;

pub fn run(command: Commands, format: OutputFormat) {
    match command {
        Commands::Caps => caps::run(&format),
        Commands::Ls { path } => ls::run(&path, &format),
        Commands::Conns => conns::run(&format),
        Commands::Fw => fw::run(&format),
        Commands::Extract { paths } => extract::run(paths, &format),
    }
}
