//! xtask: automatización del workspace (build, test, release para ambos SO).
//! Se invoca como: cargo xtask <comando>
//! Requiere el alias en .cargo/config.toml (ya incluido en este cascarón).

use clap::{Parser, Subcommand};
use std::process::Command;

#[derive(Parser)]
struct Xtask {
    #[command(subcommand)]
    command: Task,
}

#[derive(Subcommand)]
enum Task {
    /// Compila todos los crates del workspace
    Build,
    /// Corre todos los tests del workspace
    Test,
    /// TODO: generar binarios de release para Windows y Linux
    Release,
}

fn main() {
    let xtask = Xtask::parse();

    match xtask.command {
        Task::Build => run("cargo", &["build", "--workspace"]),
        Task::Test => run("cargo", &["test", "--workspace"]),
        Task::Release => {
            todo!("armar el pipeline de release cross-platform")
        }
    }
}

fn run(cmd: &str, args: &[&str]) {
    let status = Command::new(cmd)
        .args(args)
        .status()
        .expect("no se pudo ejecutar el comando");

    if !status.success() {
        std::process::exit(status.code().unwrap_or(1));
    }
}
