//! Implementación específica de Linux (nftables/iptables). TODO: implementar de verdad.
use crate::error::FirewallError;

pub fn list_rules() -> Result<Vec<String>, FirewallError> {
    todo!("implementar list_rules para Linux")
}
