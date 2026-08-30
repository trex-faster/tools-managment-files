mod cli;
mod commands;
mod config;
mod output;

use clap::Parser;
use cli::Cli;
use output::OutputFormat;

fn main() {
    tracing_subscriber::fmt::init();

    let cli = Cli::parse();
    let format = OutputFormat::from(cli.output.as_str());

    // TODO: usar config::Config::load() para defaults del usuario
    let _config = config::Config::load();

    commands::run(cli.command, format);
}
