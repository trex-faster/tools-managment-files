use crate::output::{print_error, print_list, OutputFormat};

pub fn run(format: &OutputFormat) {
    match net_tools::list_connections() {
        Ok(conns) => print_list(&conns, format),
        Err(e) => print_error(e),
    }
}
