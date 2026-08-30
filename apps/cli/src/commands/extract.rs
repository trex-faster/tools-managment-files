use crate::output::OutputFormat;
use std::path::PathBuf;

pub fn run(paths: Vec<String>, _format: &OutputFormat) {
    let paths: Vec<PathBuf> = paths.into_iter().map(PathBuf::from).collect();
    let total = paths.len();

    let outcomes = archive_tools::batch_extract(&paths);

    let mut ok_count = 0;
    for outcome in &outcomes {
        match &outcome.result {
            Ok(()) => {
                ok_count += 1;
                println!("✓ {}  ->  {}", outcome.archive.display(), outcome.dest.display());
            }
            Err(e) => {
                println!("✗ {}  ({e})", outcome.archive.display());
            }
        }
    }

    println!("\n{ok_count}/{total} archivos extraídos correctamente.");
}
