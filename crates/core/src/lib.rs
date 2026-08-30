//! mikit-core
//! Tipos, traits y utilidades compartidas entre todos los módulos del kit.
//! Ningún módulo (fs-tools, net-tools, firewall) debería depender de otro
//! módulo hermano: todos dependen de core, y core no depende de nadie.

pub mod capabilities;
pub mod error;

pub use capabilities::Capabilities;
pub use error::KitError;
