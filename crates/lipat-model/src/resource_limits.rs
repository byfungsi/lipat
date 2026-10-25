//! Host-configurable processing budgets. Defaults are hard ceilings; hosts may only lower them.
use crate::{LipatError, Result};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

/// Processing bounds shared by native and WASM; not a wall-clock timeout or a heap reservation.
#[derive(JsonSchema, Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(default, rename_all = "camelCase", deny_unknown_fields)]
pub struct ResourceLimits {
    #[schemars(range(min = 1, max = 100663296))]
    pub max_request_bytes: usize,
    #[schemars(range(min = 0, max = 33554432))]
    pub max_pptx_bytes: usize,
    #[schemars(range(min = 0, max = 67108864))]
    pub max_expanded_bytes: usize,
    #[schemars(range(min = 0, max = 33554432))]
    pub max_entry_bytes: usize,
    #[schemars(range(min = 0, max = 10000))]
    pub max_entries: usize,
    #[schemars(range(min = 0, max = 8388608))]
    pub max_xml_bytes: usize,
    #[schemars(range(min = 1, max = 200000))]
    pub max_xml_nodes: u32,
    #[schemars(range(min = 0, max = 10000))]
    pub max_slides: usize,
    #[schemars(range(min = 0, max = 100000))]
    pub max_nodes: usize,
    #[schemars(range(min = 0, max = 64))]
    pub max_depth: usize,
    #[schemars(range(min = 0, max = 67108864))]
    pub max_asset_bytes: usize,
    #[schemars(range(min = 0, max = 1000000))]
    pub max_text_bytes: usize,
    #[schemars(range(min = 0, max = 10000))]
    pub max_text_lines: usize,
    #[schemars(range(min = 0, max = 100000))]
    pub max_scene_elements: usize,
    #[schemars(range(min = 0, max = 10000000))]
    pub max_table_cells: usize,
    #[schemars(range(min = 0, max = 100000000))]
    pub max_layout_work: usize,
}
impl Default for ResourceLimits {
    fn default() -> Self {
        Self {
            max_request_bytes: 96 * 1024 * 1024,
            max_pptx_bytes: 32 * 1024 * 1024,
            max_expanded_bytes: 64 * 1024 * 1024,
            max_entry_bytes: 32 * 1024 * 1024,
            max_entries: 10000,
            max_xml_bytes: 8 * 1024 * 1024,
            max_xml_nodes: 200000,
            max_slides: 10000,
            max_nodes: 100000,
            max_depth: 64,
            max_asset_bytes: 64 * 1024 * 1024,
            max_text_bytes: 1_000_000,
            max_text_lines: 10000,
            max_scene_elements: 100000,
            max_table_cells: 10_000_000,
            max_layout_work: 100_000_000,
        }
    }
}
impl ResourceLimits {
    /// Reject unsupported configurations instead of silently clamping or raising hard safety ceilings.
    pub fn check(&self) -> Result<()> {
        let hard = Self::default();
        macro_rules! bounded { ($($field:ident),*) => { $(if self.$field > hard.$field { return Err(LipatError::new("invalidLimits", concat!("Resource limit exceeds hard ceiling: ", stringify!($field)))); })* }; }
        bounded!(
            max_request_bytes,
            max_pptx_bytes,
            max_expanded_bytes,
            max_entry_bytes,
            max_entries,
            max_xml_bytes,
            max_xml_nodes,
            max_slides,
            max_nodes,
            max_depth,
            max_asset_bytes,
            max_text_bytes,
            max_text_lines,
            max_scene_elements,
            max_table_cells,
            max_layout_work
        );
        if self.max_request_bytes == 0 || self.max_xml_nodes == 0 {
            return Err(LipatError::new(
                "invalidLimits",
                "Request bytes and XML node limits must be positive",
            ));
        }
        Ok(())
    }
}
/// Use stable machine-readable errors at each point where a processing budget is consumed.
pub fn resource_limit(name: &str) -> LipatError {
    LipatError::new(
        "resourceLimit",
        format!("Lipat resource limit exceeded: {name}"),
    )
}
