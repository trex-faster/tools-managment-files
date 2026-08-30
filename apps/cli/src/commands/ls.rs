use crate::output::{print_error, print_list, OutputFormat};

pub fn run(path: &str, format: &OutputFormat) {
    match fs_tools::list_dir(path) {
        Ok(entries) => print_list(&entries, format),
        Err(e) => print_error(e),
    }
}
