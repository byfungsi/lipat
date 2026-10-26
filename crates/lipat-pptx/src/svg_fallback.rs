//! Deterministic SVG fallback pixels; fonts are bundled, and no system font/file discovery is enabled.
use lipat_model::*;
use resvg::{tiny_skia, usvg};

/// Rasterize the admitted static profile at at most 2048 pixels per edge and four megapixels total.
pub(crate) fn svg_fallback(bytes: &[u8], limits: &ResourceLimits) -> Result<Vec<u8>> {
    check_svg(bytes, limits)?;
    let mut options = usvg::Options {
        font_family: "Lato".into(),
        ..usvg::Options::default()
    };
    options
        .fontdb_mut()
        .load_font_data(include_bytes!("../fonts/Lato-Regular.ttf").to_vec());
    options.fontdb_mut().set_sans_serif_family("Lato");
    options.fontdb_mut().set_serif_family("Lato");
    options.fontdb_mut().set_monospace_family("Lato");
    let tree = usvg::Tree::from_data(bytes, &options).map_err(|_| {
        LipatError::new(
            "invalidSvg",
            "SVG fallback could not parse the static image",
        )
    })?;
    let size = tree.size();
    let scale = (2048. / size.width().max(size.height())).min(2.);
    let width = (size.width() * scale).ceil().max(1.) as u32;
    let height = (size.height() * scale).ceil().max(1.) as u32;
    if (width as usize)
        .saturating_mul(height as usize)
        .saturating_mul(4)
        > limits.max_asset_bytes
    {
        return Err(resource_limit("maxAssetBytes/SVG fallback"));
    }
    let mut pixmap = tiny_skia::Pixmap::new(width, height)
        .ok_or_else(|| resource_limit("SVG fallback pixels"))?;
    resvg::render(
        &tree,
        tiny_skia::Transform::from_scale(scale, scale),
        &mut pixmap.as_mut(),
    );
    pixmap
        .encode_png()
        .map_err(|_| LipatError::new("exportFailed", "SVG fallback PNG encoding failed"))
}
