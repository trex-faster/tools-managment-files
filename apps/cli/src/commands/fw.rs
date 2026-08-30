use crate::output::{print_error, print_list, OutputFormat};

pub fn run(format: &OutputFormat) {
    match firewall::list_rules() {
        Ok(rules) => print_list(&rules, format),
        Err(e) => print_error(e),
    }
}
