//! Independent PPTX byte adapter. Does not depend on the authoring or layout engines.
mod animation_timing;
mod package;
mod read_pptx;
mod write_pptx;
pub use read_pptx::{parse_pptx, ImportedPresentation, SourceMetadata};
pub use write_pptx::{write_pptx, ExportedPresentation};
