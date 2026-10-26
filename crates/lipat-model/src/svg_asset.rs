//! Static SVG image profile: no executable content, CSS sheets, images or external references.
use crate::{resource_limit, LipatError, ResourceLimits, Result};

const ELEMENTS: &str = "svg g defs path rect circle ellipse line polyline polygon linearGradient radialGradient stop clipPath mask title desc text tspan";
const ATTRIBUTES: &str = "id viewBox width height x y x1 y1 x2 y2 cx cy r rx ry d points transform gradientTransform gradientUnits spreadMethod offset stop-color stop-opacity fill fill-opacity fill-rule stroke stroke-width stroke-opacity stroke-linecap stroke-linejoin stroke-miterlimit stroke-dasharray stroke-dashoffset opacity clip-path clip-rule clipPathUnits mask maskUnits maskContentUnits preserveAspectRatio font-family font-size font-weight font-style text-anchor dominant-baseline letter-spacing dx dy color vector-effect";
const STYLES: &str = "fill fill-opacity fill-rule stroke stroke-width stroke-opacity stroke-linecap stroke-linejoin stroke-miterlimit stroke-dasharray stroke-dashoffset opacity stop-color stop-opacity font-family font-size font-weight font-style text-anchor letter-spacing color";

fn invalid_svg() -> LipatError {
    LipatError::new("invalidSvg", "SVG image must use the static vector profile: shapes, paths, gradients, clipping and text; scripts, event handlers, stylesheets, images, use, animation and external resources are unsupported")
}
fn listed(list: &str, value: &str) -> bool {
    list.split_whitespace().any(|v| v == value)
}
fn safe_value(value: &str) -> bool {
    let value = value.trim();
    if value.contains(['\\', '<', '>', '@', ':']) {
        return false;
    }
    if value.to_ascii_lowercase().contains("url") {
        return value
            .strip_prefix("url(#")
            .and_then(|v| v.strip_suffix(')'))
            .is_some_and(valid_svg_id);
    }
    true
}
fn valid_svg_id(value: &str) -> bool {
    !value.is_empty()
        && value
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b"_.-".contains(&b))
}
fn svg_length(value: &str) -> Option<f64> {
    let units = [
        ("px", 1.),
        ("pt", 96. / 72.),
        ("pc", 16.),
        ("in", 96.),
        ("cm", 96. / 2.54),
        ("mm", 96. / 25.4),
    ];
    for (unit, scale) in units {
        if let Some(number) = value.trim().strip_suffix(unit) {
            return number.trim().parse::<f64>().ok().map(|v| v * scale);
        }
    }
    value.trim().parse().ok()
}

/// Check SVG XML before any renderer sees it; returns intrinsic width/height without host font or file access.
pub fn check_svg(bytes: &[u8], limits: &ResourceLimits) -> Result<(f64, f64)> {
    if bytes.len() > limits.max_xml_bytes.min(1024 * 1024) {
        return Err(resource_limit("maxXmlBytes/SVG"));
    }
    let text = std::str::from_utf8(bytes).map_err(|_| invalid_svg())?;
    let xml = roxmltree::Document::parse_with_options(
        text,
        roxmltree::ParsingOptions {
            allow_dtd: false,
            nodes_limit: limits.max_xml_nodes.min(16_000),
        },
    )
    .map_err(|e| {
        if matches!(e, roxmltree::Error::NodesLimitReached) {
            resource_limit("maxXmlNodes/SVG")
        } else {
            invalid_svg()
        }
    })?;
    let root = xml.root_element();
    if root.tag_name().name() != "svg"
        || root.tag_name().namespace() != Some("http://www.w3.org/2000/svg")
    {
        return Err(invalid_svg());
    }
    let mut ids = std::collections::HashSet::new();
    for node in xml.descendants() {
        if node.is_pi() {
            return Err(invalid_svg());
        }
        if node.ancestors().filter(|n| n.is_element()).count() > 32 {
            return Err(resource_limit("SVG depth"));
        }
        if !node.is_element() {
            continue;
        }
        if node.tag_name().namespace() != Some("http://www.w3.org/2000/svg")
            || !listed(ELEMENTS, node.tag_name().name())
        {
            return Err(invalid_svg());
        }
        for attr in node.attributes() {
            if attr.namespace() == Some("http://www.w3.org/XML/1998/namespace")
                && attr.name() == "space"
            {
                continue;
            }
            if attr.namespace().is_some() {
                return Err(invalid_svg());
            }
            if attr.name() == "style" {
                for property in attr.value().split(';').filter(|v| !v.trim().is_empty()) {
                    let (name, value) = property.split_once(':').ok_or_else(invalid_svg)?;
                    if !listed(STYLES, name.trim()) || !safe_value(value) {
                        return Err(invalid_svg());
                    }
                }
            } else if !listed(ATTRIBUTES, attr.name()) || !safe_value(attr.value()) {
                return Err(invalid_svg());
            }
            if attr.name() == "id" && (!valid_svg_id(attr.value()) || !ids.insert(attr.value())) {
                return Err(invalid_svg());
            }
        }
    }
    let viewbox: Vec<f64> = root
        .attribute("viewBox")
        .unwrap_or("")
        .split(|c: char| c.is_whitespace() || c == ',')
        .filter(|v| !v.is_empty())
        .map(|s| s.parse().map_err(|_| invalid_svg()))
        .collect::<Result<Vec<_>>>()?;
    if root.attribute("viewBox").is_some()
        && (viewbox.len() != 4
            || viewbox.iter().any(|v| !v.is_finite())
            || viewbox[2] <= 0.
            || viewbox[3] <= 0.)
    {
        return Err(invalid_svg());
    }
    let dimension = |name, index| {
        root.attribute(name).and_then(svg_length).or_else(|| {
            if viewbox.len() == 4 {
                viewbox.get(index).copied()
            } else {
                None
            }
        })
    };
    let (w, h) = dimension("width", 2)
        .zip(dimension("height", 3))
        .ok_or_else(invalid_svg)?;
    if !w.is_finite() || !h.is_finite() || w <= 0. || h <= 0. || w > 1e6 || h > 1e6 {
        return Err(invalid_svg());
    }
    Ok((w, h))
}
