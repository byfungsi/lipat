//! Independent PPTX byte adapter. Does not depend on the authoring or layout engines.
mod animation_timing;
mod chart_package;
mod package;
mod read_pptx;
mod svg_fallback;
mod write_pptx;
pub use read_pptx::{parse_pptx, parse_pptx_with_limits, ImportedPresentation, SourceMetadata};
pub use write_pptx::{write_pptx, write_pptx_with_limits, ExportedPresentation};
