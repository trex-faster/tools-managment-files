use crate::output::OutputFormat;
use mikit_core::Capabilities;

pub fn run(_format: &OutputFormat) {
    let caps = Capabilities::detect();
    println!("{caps:#?}");
}
