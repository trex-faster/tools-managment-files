pub mod rar;
pub mod rar_provider;
pub mod zip;

use crate::error::ArchiveError;
use std::path::Path;

pub enum Format {
    Zip,
    Rar,
}

impl Format {
    pub fn from_path(path: &Path) -> Result<Self, ArchiveError> {
        let ext = path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();

        match ext.as_str() {
            "zip" => Ok(Format::Zip),
            "rar" => Ok(Format::Rar),
            other => Err(ArchiveError::UnknownFormat(other.to_string())),
        }
    }
}
