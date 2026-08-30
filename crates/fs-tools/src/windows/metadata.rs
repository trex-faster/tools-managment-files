//! Metadata de archivos específica de Windows (atributos NTFS, ACLs, etc.)
//! TODO: implementar con `std::os::windows::fs::MetadataExt` o `windows-rs`.
use crate::error::FsError;

pub fn get_permissions(path: &str) -> Result<String, FsError> {
    let _ = path;
    todo!("leer atributos/ACL del archivo en Windows")
}
