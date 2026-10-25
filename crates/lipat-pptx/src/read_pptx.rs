use crate::animation_timing::read_slide_timing;
use crate::package::*;
use base64::{engine::general_purpose::STANDARD, Engine};
use lipat_model::*;
use roxmltree::Node as XmlNode;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SourceMetadata {
    pub format: String,
    pub parts: Vec<String>,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportedPresentation {
    pub scene: SlideScene,
    pub diagnostics: Vec<Diagnostic>,
    pub source: SourceMetadata,
}
fn num(n: Option<&str>, default: f64) -> f64 {
    n.and_then(|s| s.parse::<f64>().ok())
        .filter(|n| n.is_finite())
        .unwrap_or(default)
}
fn color(n: XmlNode<'_, '_>, colors: &BTreeMap<String, String>) -> Option<String> {
    if let Some(rgb) = descendant(n, "srgbClr").and_then(|n| n.attribute("val")) {
        if rgb.len() == 6 && rgb.bytes().all(|c| c.is_ascii_hexdigit()) {
            return Some(format!("#{rgb}"));
        }
    }
    if let Some(scheme) = descendant(n, "schemeClr").and_then(|n| n.attribute("val")) {
        return colors.get(scheme).cloned();
    }
    None
}
fn frame(n: XmlNode<'_, '_>) -> Option<Frame> {
    let xfrm = child(n, "spPr")
        .and_then(|n| child(n, "xfrm"))
        .or_else(|| child(n, "xfrm"))?;
    let off = child(xfrm, "off")?;
    let ext = child(xfrm, "ext")?;
    Some(Frame {
        x: num(off.attribute("x"), 0.) / 12700.,
        y: num(off.attribute("y"), 0.) / 12700.,
        width: num(ext.attribute("cx"), 0.) / 12700.,
        height: num(ext.attribute("cy"), 0.) / 12700.,
        rotation: num(xfrm.attribute("rot"), 0.) / 60000.,
    })
}
fn text_style(n: XmlNode<'_, '_>, colors: &BTreeMap<String, String>) -> TextStyle {
    TextStyle {
        font_family: child(n, "latin")
            .and_then(|n| n.attribute("typeface"))
            .filter(|s| !s.starts_with('+'))
            .map(String::from),
        font_size: n.attribute("sz").map(|s| num(Some(s), 2400.) / 100.),
        color: child(n, "solidFill").and_then(|n| color(n, colors)),
        bold: n.attribute("b").map(|s| s == "1" || s == "true"),
        italic: n.attribute("i").map(|s| s == "1" || s == "true"),
        underline: n.attribute("u").map(|s| s != "none"),
        align: n.attribute("algn").map(|s| {
            match s {
                "ctr" => "center",
                "r" => "right",
                "just" => "justify",
                _ => "left",
            }
            .into()
        }),
    }
}
fn merge_style(a: &TextStyle, b: &TextStyle) -> TextStyle {
    TextStyle {
        font_family: b.font_family.clone().or_else(|| a.font_family.clone()),
        font_size: b.font_size.or(a.font_size),
        color: b.color.clone().or_else(|| a.color.clone()),
        bold: b.bold.or(a.bold),
        italic: b.italic.or(a.italic),
        underline: b.underline.or(a.underline),
        align: b.align.clone().or_else(|| a.align.clone()),
    }
}
fn shape_text(
    n: XmlNode<'_, '_>,
    colors: &BTreeMap<String, String>,
    limits: &ResourceLimits,
) -> Result<(String, Vec<TextRun>, TextStyle)> {
    let text_bytes: usize = n
        .descendants()
        .filter(|n| n.has_tag_name("t"))
        .filter_map(|n| n.text())
        .map(str::len)
        .sum();
    if text_bytes > limits.max_text_bytes {
        return Err(resource_limit("maxTextBytes"));
    }
    let hard_lines = n
        .descendants()
        .filter(|n| n.has_tag_name("p") || n.has_tag_name("br"))
        .count();
    if hard_lines > limits.max_text_lines {
        return Err(resource_limit("maxTextLines"));
    }
    let Some(body) = child(n, "txBody") else {
        return Ok((String::new(), vec![], TextStyle::default()));
    };
    let mut runs = vec![];
    let mut base = TextStyle {
        font_family: Some("Arial".into()),
        font_size: Some(24.),
        color: Some("#172033".into()),
        ..TextStyle::default()
    };
    for (index, p) in body.children().filter(|p| p.has_tag_name("p")).enumerate() {
        if index > 0 {
            runs.push(TextRun {
                text: "\n".into(),
                style: TextStyle::default(),
            });
        }
        let paragraph = child(p, "pPr")
            .map(|n| text_style(n, colors))
            .unwrap_or_default();
        let paragraph = child(p, "pPr")
            .and_then(|n| child(n, "defRPr"))
            .map(|n| merge_style(&paragraph, &text_style(n, colors)))
            .unwrap_or(paragraph);
        if index == 0 {
            base = merge_style(&base, &paragraph);
        }
        if let Some(bullet) = child(p, "pPr")
            .and_then(|n| child(n, "buChar"))
            .and_then(|n| n.attribute("char"))
        {
            runs.push(TextRun {
                text: format!("{bullet} "),
                style: paragraph.clone(),
            });
        }
        for r in p.children().filter(|n| n.is_element()) {
            match r.tag_name().name() {
                "r" | "fld" => {
                    let style = child(r, "rPr")
                        .map(|n| merge_style(&paragraph, &text_style(n, colors)))
                        .unwrap_or_else(|| paragraph.clone());
                    let text = child(r, "t").and_then(|n| n.text()).unwrap_or("");
                    if !text.is_empty() {
                        if runs.is_empty() {
                            base = merge_style(&base, &style);
                        }
                        runs.push(TextRun {
                            text: text.into(),
                            style,
                        });
                    }
                }
                "br" => runs.push(TextRun {
                    text: "\n".into(),
                    style: paragraph.clone(),
                }),
                _ => {}
            }
        }
    }
    if runs.iter().map(|r| r.text.len()).sum::<usize>() > limits.max_text_bytes {
        return Err(resource_limit("maxTextBytes"));
    }
    let text = runs.iter().map(|r| r.text.as_str()).collect();
    Ok((text, runs, base))
}
struct ShapeReadContext<'a> {
    depth: usize,
    rels: &'a BTreeMap<String, Relationship>,
    slide_id: &'a str,
    prefix: &'a str,
    inherited: &'a BTreeMap<String, Frame>,
    transform: Option<(f64, f64, f64, f64)>,
}
struct Reader {
    parts: Parts,
    assets: Vec<Asset>,
    asset_paths: BTreeMap<String, String>,
    diagnostics: Vec<Diagnostic>,
    colors: BTreeMap<String, String>,
    limits: ResourceLimits,
    element_count: usize,
    asset_bytes: usize,
    table_cells: usize,
}
impl Reader {
    fn push_element(&mut self, out: &mut Vec<SceneElement>, element: SceneElement) -> Result<()> {
        self.element_count += 1;
        if self.element_count > self.limits.max_scene_elements {
            return Err(resource_limit("maxSceneElements"));
        }
        out.push(element);
        Ok(())
    }
    fn warn(&mut self, code: &str, message: impl Into<String>, slide: &str, node: Option<String>) {
        self.diagnostics
            .push(Diagnostic::warning(code, message, Some(slide.into()), node));
    }
    fn image(&mut self, path: &str) -> Result<Option<String>> {
        if let Some(id) = self.asset_paths.get(path) {
            return Ok(Some(id.clone()));
        }
        let mime = match path
            .rsplit('.')
            .next()
            .unwrap_or("")
            .to_ascii_lowercase()
            .as_str()
        {
            "png" => "image/png",
            "jpg" | "jpeg" => "image/jpeg",
            "gif" => "image/gif",
            "webp" => "image/webp",
            _ => return Ok(None),
        };
        let bytes = self.parts.get(path).ok_or_else(|| {
            LipatError::new("invalidPptx", format!("Missing embedded image: {path}"))
        })?;
        self.asset_bytes = self.asset_bytes.saturating_add(bytes.len());
        if self.asset_bytes > self.limits.max_asset_bytes {
            return Err(resource_limit("maxAssetBytes"));
        }
        let id = format!("asset-{}", self.assets.len() + 1);
        self.assets.push(Asset {
            id: id.clone(),
            mime_type: mime.into(),
            data: STANDARD.encode(bytes),
            width: None,
            height: None,
        });
        self.asset_paths.insert(path.into(), id.clone());
        Ok(Some(id))
    }
    fn read_shapes(
        &mut self,
        root: XmlNode<'_, '_>,
        context: ShapeReadContext<'_>,
        out: &mut Vec<SceneElement>,
    ) -> Result<()> {
        let ShapeReadContext {
            depth,
            rels,
            slide_id,
            prefix,
            inherited,
            transform,
        } = context;
        if depth > self.limits.max_depth {
            return Err(resource_limit("maxDepth"));
        }
        for (index, n) in root.children().filter(|n| n.is_element()).enumerate() {
            let tag = n.tag_name().name();
            if matches!(tag, "nvGrpSpPr" | "grpSpPr" | "extLst") {
                continue;
            }
            let id = format!(
                "{slide_id}-{prefix}-{}-{index}",
                descendant(n, "cNvPr")
                    .and_then(|n| n.attribute("id"))
                    .unwrap_or("element")
            );
            let ph = descendant(n, "ph");
            let ph_key = ph.map(|p| {
                format!(
                    "{}:{}",
                    p.attribute("type").unwrap_or("body"),
                    p.attribute("idx").unwrap_or("0")
                )
            });
            let mut f = frame(n)
                .or_else(|| ph_key.as_ref().and_then(|key| inherited.get(key).copied()))
                .unwrap_or(Frame {
                    x: 0.,
                    y: 0.,
                    width: 720.,
                    height: 60.,
                    rotation: 0.,
                });
            if let Some((sx, sy, tx, ty)) = transform {
                f.x = f.x * sx + tx;
                f.y = f.y * sy + ty;
                f.width *= sx.abs();
                f.height *= sy.abs();
            }
            match tag {
                "sp" | "cxnSp" => {
                    let sp = child(n, "spPr");
                    let fill = sp
                        .and_then(|n| child(n, "solidFill"))
                        .and_then(|n| color(n, &self.colors));
                    let stroke = sp
                        .and_then(|n| child(n, "ln"))
                        .and_then(|n| child(n, "solidFill"))
                        .and_then(|n| color(n, &self.colors));
                    let preset = sp
                        .and_then(|n| child(n, "prstGeom"))
                        .and_then(|n| n.attribute("prst"))
                        .unwrap_or("rect");
                    let geometry = if tag == "cxnSp" {
                        "line"
                    } else {
                        match preset {
                            "rect" | "roundRect" | "ellipse" | "line" => preset,
                            _ => {
                                self.warn(
                                    "unsupportedGeometry",
                                    format!(
                                        "Shape geometry {preset} is represented as a rectangle"
                                    ),
                                    slide_id,
                                    Some(id.clone()),
                                );
                                "rect"
                            }
                        }
                    };
                    if fill.is_some() || stroke.is_some() || tag == "cxnSp" {
                        self.push_element(
                            out,
                            SceneElement {
                                id: format!("{id}-shape"),
                                frame: f,
                                style: TextStyle::default(),
                                step: None,
                                animation: None,
                                kind: SceneKind::Shape {
                                    geometry: geometry.into(),
                                    fill,
                                    stroke,
                                },
                            },
                        )?;
                    }
                    let (text, runs, style) = shape_text(n, &self.colors, &self.limits)?;
                    if !text.is_empty() {
                        self.push_element(
                            out,
                            SceneElement {
                                id: id.clone(),
                                frame: f,
                                style: style.clone(),
                                step: None,
                                animation: None,
                                kind: SceneKind::Text {
                                    line_height: style.font_size.unwrap_or(24.) * 1.2,
                                    lines: text.split('\n').map(String::from).collect(),
                                    text,
                                    runs,
                                },
                            },
                        )?;
                    }
                    if descendant(n, "custGeom").is_some() {
                        self.warn(
                            "unsupportedGeometry",
                            "Custom paths are outside the supported geometry subset",
                            slide_id,
                            Some(id),
                        );
                    }
                }
                "pic" => {
                    let crop = descendant(n, "srcRect");
                    let symmetric = crop.is_some_and(|c| {
                        c.attribute("l").unwrap_or("0") == c.attribute("r").unwrap_or("0")
                            && c.attribute("t").unwrap_or("0") == c.attribute("b").unwrap_or("0")
                    });
                    let rel = descendant(n, "blip")
                        .and_then(|n| rel_attr(n, "embed").or_else(|| rel_attr(n, "link")))
                        .and_then(|id| rels.get(id))
                        .filter(|r| r.kind.ends_with("/image"));
                    let source = if let Some(rel) = rel {
                        if rel.external {
                            if check_image_url(&rel.target).is_ok() {
                                self.warn(
                                    "linkedImage",
                                    "External image URL retained without fetching it",
                                    slide_id,
                                    Some(id.clone()),
                                );
                                Some(ImageSource::Url {
                                    url: rel.target.clone(),
                                })
                            } else {
                                None
                            }
                        } else {
                            self.image(&rel.target)?
                                .map(|asset_id| ImageSource::Asset { asset_id })
                        }
                    } else {
                        None
                    };
                    if let Some(source) = source {
                        self.push_element(
                            out,
                            SceneElement {
                                id: id.clone(),
                                frame: f,
                                style: TextStyle::default(),
                                step: None,
                                animation: None,
                                kind: SceneKind::Image {
                                    source,
                                    alt: descendant(n, "cNvPr")
                                        .and_then(|n| n.attribute("descr"))
                                        .unwrap_or("")
                                        .into(),
                                    fit: if symmetric {
                                        "cover".into()
                                    } else {
                                        "stretch".into()
                                    },
                                },
                            },
                        )?;
                    } else {
                        self.warn(
                            "unsupportedImage",
                            "Missing, invalid linked image, or unsupported raster image",
                            slide_id,
                            Some(id.clone()),
                        );
                    }
                    if crop.is_some() && !symmetric {
                        self.warn(
                            "imageCrop",
                            "Asymmetric image crop is not retained",
                            slide_id,
                            Some(id),
                        );
                    }
                }
                "graphicFrame" => {
                    if let Some(table) = descendant(n, "tbl") {
                        let mut table_rows = vec![];
                        let start_cells = self.table_cells;
                        let mut table_text_bytes = 0usize;
                        for row in table.children().filter(|n| n.has_tag_name("tr")) {
                            let mut cells = vec![];
                            for cell in row.children().filter(|n| n.has_tag_name("tc")) {
                                self.table_cells += 1;
                                if self.table_cells > self.limits.max_table_cells {
                                    return Err(resource_limit("maxTableCells"));
                                }
                                if cell.attribute("gridSpan").is_some()
                                    || cell.attribute("rowSpan").is_some()
                                    || cell.attribute("hMerge") == Some("1")
                                    || cell.attribute("vMerge") == Some("1")
                                {
                                    self.warn(
                                        "tableMerge",
                                        "Merged table cell semantics are flattened",
                                        slide_id,
                                        Some(id.clone()),
                                    );
                                }
                                let text = shape_text(cell, &self.colors, &self.limits)?.0;
                                table_text_bytes = table_text_bytes.saturating_add(text.len());
                                if table_text_bytes > self.limits.max_text_bytes {
                                    return Err(resource_limit("maxTextBytes"));
                                }
                                cells.push(text);
                            }
                            table_rows.push(cells);
                        }
                        let columns = table_rows.first().cloned().unwrap_or_default();
                        if !columns.is_empty() {
                            let width = columns.len();
                            self.table_cells = self.table_cells.max(
                                start_cells.saturating_add(width.saturating_mul(table_rows.len())),
                            );
                            if self.table_cells > self.limits.max_table_cells {
                                return Err(resource_limit("maxTableCells"));
                            }
                            for row in &mut table_rows {
                                row.resize(width, String::new());
                                row.truncate(width);
                            }
                            self.push_element(
                                out,
                                SceneElement {
                                    id,
                                    frame: f,
                                    style: TextStyle {
                                        font_family: Some("Arial".into()),
                                        font_size: Some(18.),
                                        color: Some("#172033".into()),
                                        ..TextStyle::default()
                                    },
                                    step: None,
                                    animation: None,
                                    kind: SceneKind::Table {
                                        columns,
                                        rows: table_rows.into_iter().skip(1).collect(),
                                    },
                                },
                            )?;
                        }
                    } else {
                        self.warn(
                            "unsupportedGraphic",
                            "Charts, SmartArt and embedded graphics are omitted",
                            slide_id,
                            Some(id),
                        );
                    }
                }
                "grpSp" => {
                    let xfrm = child(n, "grpSpPr").and_then(|n| child(n, "xfrm"));
                    let off = xfrm.and_then(|n| child(n, "off"));
                    let ext = xfrm.and_then(|n| child(n, "ext"));
                    let ch_off = xfrm.and_then(|n| child(n, "chOff"));
                    let ch_ext = xfrm.and_then(|n| child(n, "chExt"));
                    let sx = num(ext.and_then(|n| n.attribute("cx")), 1.)
                        / num(ch_ext.and_then(|n| n.attribute("cx")), 1.).max(1.);
                    let sy = num(ext.and_then(|n| n.attribute("cy")), 1.)
                        / num(ch_ext.and_then(|n| n.attribute("cy")), 1.).max(1.);
                    let tx = (num(off.and_then(|n| n.attribute("x")), 0.)
                        - num(ch_off.and_then(|n| n.attribute("x")), 0.) * sx)
                        / 12700.;
                    let ty = (num(off.and_then(|n| n.attribute("y")), 0.)
                        - num(ch_off.and_then(|n| n.attribute("y")), 0.) * sy)
                        / 12700.;
                    let (sx, sy, tx, ty) = if let Some((psx, psy, ptx, pty)) = transform {
                        (sx * psx, sy * psy, tx * psx + ptx, ty * psy + pty)
                    } else {
                        (sx, sy, tx, ty)
                    };
                    self.warn(
                        "flattenedGroup",
                        "Group hierarchy is flattened; group rotation and flips are not retained",
                        slide_id,
                        Some(id.clone()),
                    );
                    self.read_shapes(
                        n,
                        ShapeReadContext {
                            depth: depth + 1,
                            rels,
                            slide_id,
                            prefix: &format!("{prefix}-g{index}"),
                            inherited,
                            transform: Some((sx, sy, tx, ty)),
                        },
                        out,
                    )?;
                }
                "AlternateContent" => self.warn(
                    "unsupportedAlternateContent",
                    "Alternate content is omitted",
                    slide_id,
                    Some(id),
                ),
                _ => self.warn(
                    "unsupportedElement",
                    format!("Unsupported slide element: {tag}"),
                    slide_id,
                    Some(id),
                ),
            }
        }
        Ok(())
    }
}
/// Read an unencrypted PPTX from bytes without filesystem, network or authoring dependencies.
pub fn parse_pptx(bytes: &[u8]) -> Result<ImportedPresentation> {
    parse_pptx_with_limits(bytes, &ResourceLimits::default())
}
/// Parse with host budgets checked before ZIP expansion, XML allocation and primitive materialization.
pub fn parse_pptx_with_limits(
    bytes: &[u8],
    limits: &ResourceLimits,
) -> Result<ImportedPresentation> {
    let parts = read_package_with_limits(bytes, limits)?;
    if !parts.contains_key("[Content_Types].xml") {
        return Err(LipatError::new("invalidPptx", "Missing OPC content types"));
    }
    parse_xml(xml_text(&parts, "[Content_Types].xml")?, limits)?;
    let root_rels = relationships(&parts, "")?;
    let presentation = root_rels
        .values()
        .find(|r| r.kind.ends_with("/officeDocument") && !r.external)
        .ok_or_else(|| LipatError::new("invalidPptx", "Missing presentation relationship"))?
        .target
        .clone();
    let pdoc = parse_xml(xml_text(&parts, &presentation)?, limits)?;
    if pdoc.root_element().tag_name().name() != "presentation" {
        return Err(LipatError::new(
            "invalidPptx",
            "Office document is not a presentation",
        ));
    }
    let size = descendant(pdoc.root_element(), "sldSz")
        .map(|n| Size {
            width: num(n.attribute("cx"), 12192000.) / 12700.,
            height: num(n.attribute("cy"), 6858000.) / 12700.,
        })
        .unwrap_or_default();
    let slide_refs = descendant(pdoc.root_element(), "sldIdLst")
        .map(|n| {
            n.children()
                .filter(|n| n.has_tag_name("sldId"))
                .filter_map(|n| rel_attr(n, "id").map(String::from))
                .collect::<Vec<_>>()
        })
        .unwrap_or_default();
    if slide_refs.len() > limits.max_slides {
        return Err(resource_limit("maxSlides"));
    }
    if slide_refs.is_empty() {
        return Err(LipatError::new(
            "invalidPptx",
            "Expected 1–10000 referenced slides",
        ));
    }
    drop(pdoc);
    let rels = relationships(&parts, &presentation)?;
    let title = if parts.contains_key("docProps/core.xml") {
        let core = parse_xml(xml_text(&parts, "docProps/core.xml")?, limits)?;
        descendant(core.root_element(), "title")
            .and_then(|n| n.text())
            .unwrap_or("")
            .to_string()
    } else {
        String::new()
    };
    let part_names = parts.keys().cloned().collect();
    let mut colors = BTreeMap::from([
        ("bg1".into(), "#FFFFFF".into()),
        ("tx1".into(), "#172033".into()),
    ]);
    if let Some((path, _)) = parts
        .iter()
        .find(|(p, _)| p.contains("/theme/") && p.ends_with(".xml"))
    {
        let doc = parse_xml(xml_text(&parts, path)?, limits)?;
        if let Some(scheme) = descendant(doc.root_element(), "clrScheme") {
            for n in scheme.children().filter(|n| n.is_element()) {
                let value = descendant(n, "srgbClr")
                    .and_then(|n| n.attribute("val"))
                    .or_else(|| descendant(n, "sysClr").and_then(|n| n.attribute("lastClr")));
                if let Some(value) = value {
                    colors.insert(n.tag_name().name().into(), format!("#{value}"));
                }
            }
        }
    }
    if let Some(c) = colors.get("lt1").cloned() {
        colors.insert("bg1".into(), c);
    }
    if let Some(c) = colors.get("dk1").cloned() {
        colors.insert("tx1".into(), c);
    }
    let mut reader = Reader {
        limits: *limits,
        element_count: 0,
        asset_bytes: 0,
        table_cells: 0,
        parts,
        assets: vec![],
        asset_paths: BTreeMap::new(),
        diagnostics: vec![],
        colors,
    };
    let mut slides = vec![];
    for (index, rid) in slide_refs.iter().enumerate() {
        let relationship = rels
            .get(rid)
            .filter(|r| !r.external && r.kind.ends_with("/slide"))
            .ok_or_else(|| {
                LipatError::new("invalidPptx", "Missing or invalid slide relationship")
            })?;
        let path = &relationship.target;
        let text = xml_text(&reader.parts, path)?.to_string();
        let doc = parse_xml(&text, limits)?;
        if doc.root_element().tag_name().name() != "sld" {
            return Err(LipatError::new("invalidPptx", "Invalid slide XML root"));
        }
        let slide_id = format!("slide-{}", index + 1);
        let slide_rels = relationships(&reader.parts, path)?;
        let mut inherited = BTreeMap::new();
        let mut elements = vec![];
        let mut inherited_background = None;
        // Layout/master placeholders provide geometry, while decorative shapes remain independent.
        let layout_path = slide_rels
            .values()
            .find(|r| r.kind.ends_with("/slideLayout") && !r.external)
            .map(|r| r.target.clone());
        let mut inherited_parts = vec![];
        if let Some(layout_path) = layout_path {
            let layout_rels = relationships(&reader.parts, &layout_path)?;
            if let Some(master) = layout_rels
                .values()
                .find(|r| r.kind.ends_with("/slideMaster") && !r.external)
            {
                inherited_parts.push(master.target.clone());
            }
            inherited_parts.push(layout_path);
        }
        for (level, part) in inherited_parts.iter().enumerate() {
            let xml = xml_text(&reader.parts, part)?.to_string();
            let inherited_doc = parse_xml(&xml, limits)?;
            if let Some(bg) = descendant(inherited_doc.root_element(), "bg") {
                inherited_background = color(bg, &reader.colors).or(inherited_background);
            }
            if let Some(tree) = descendant(inherited_doc.root_element(), "spTree") {
                for shape in tree.children().filter(|n| n.is_element()) {
                    if let Some(ph) = descendant(shape, "ph") {
                        if let Some(frame) = frame(shape) {
                            inherited.insert(
                                format!(
                                    "{}:{}",
                                    ph.attribute("type").unwrap_or("body"),
                                    ph.attribute("idx").unwrap_or("0")
                                ),
                                frame,
                            );
                        }
                    }
                }
                let inherited_rels = relationships(&reader.parts, part)?;
                let mut decorative = vec![];
                reader.read_shapes(
                    tree,
                    ShapeReadContext {
                        depth: 0,
                        rels: &inherited_rels,
                        slide_id: &slide_id,
                        prefix: &format!("inherited-{level}"),
                        inherited: &inherited,
                        transform: None,
                    },
                    &mut decorative,
                )?;
                let placeholder_ids: Vec<String> = tree
                    .children()
                    .filter(|n| n.is_element())
                    .enumerate()
                    .filter_map(|(i, n)| {
                        descendant(n, "ph").map(|_| {
                            format!(
                                "{slide_id}-inherited-{level}-{}-{i}",
                                descendant(n, "cNvPr")
                                    .and_then(|n| n.attribute("id"))
                                    .unwrap_or("element")
                            )
                        })
                    })
                    .collect();
                elements.extend(decorative.into_iter().filter(|e| {
                    !placeholder_ids
                        .iter()
                        .any(|id| e.id == *id || e.id == format!("{id}-shape"))
                }));
            }
        }
        if let Some(tree) = descendant(doc.root_element(), "spTree") {
            reader.read_shapes(
                tree,
                ShapeReadContext {
                    depth: 0,
                    rels: &slide_rels,
                    slide_id: &slide_id,
                    prefix: "content",
                    inherited: &inherited,
                    transform: None,
                },
                &mut elements,
            )?;
        }
        if !read_slide_timing(doc.root_element(), &slide_id, size, &mut elements) {
            reader.warn(
                "unsupportedAnimation",
                "Some native animation behaviors are outside the supported entrance subset",
                &slide_id,
                None,
            );
        }
        for (tag, code) in [
            ("transition", "unsupportedTransition"),
            ("videoFile", "unsupportedMedia"),
            ("audioFile", "unsupportedMedia"),
        ] {
            if descendant(doc.root_element(), tag).is_some() {
                reader.warn(code, format!("PPTX {tag} is not retained"), &slide_id, None);
            }
        }
        let notes = if let Some(r) = slide_rels
            .values()
            .find(|r| r.kind.ends_with("/notesSlide") && !r.external)
        {
            let notes_doc = parse_xml(xml_text(&reader.parts, &r.target)?, limits)?;
            notes_doc
                .descendants()
                .filter(|n| {
                    n.has_tag_name("sp")
                        && descendant(*n, "ph").and_then(|n| n.attribute("type")) == Some("body")
                })
                .map(|n| shape_text(n, &reader.colors, limits).map(|text| text.0))
                .collect::<Result<Vec<_>>>()?
                .join("\n")
        } else {
            String::new()
        };
        let name = descendant(doc.root_element(), "cSld")
            .and_then(|n| n.attribute("name"))
            .map(String::from)
            .unwrap_or_else(|| format!("Slide {}", index + 1));
        let background = descendant(doc.root_element(), "bg")
            .and_then(|n| color(n, &reader.colors))
            .or(inherited_background)
            .unwrap_or_else(|| "#FFFFFF".into());
        slides.push(SceneSlide {
            id: slide_id,
            title: name,
            notes,
            hidden: doc.root_element().attribute("show") == Some("0"),
            background,
            parent_id: None,
            elements,
        });
    }
    let scene = SlideScene {
        version: 1,
        title,
        size,
        assets: reader.assets,
        slides,
    };
    check_scene_with_limits(&scene, limits)?;
    Ok(ImportedPresentation {
        scene,
        diagnostics: reader.diagnostics,
        source: SourceMetadata {
            format: "pptx".into(),
            parts: part_names,
        },
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    const FIXTURE: &[u8] = include_bytes!("../../../tests/fixtures/python-pptx.pptx");
    #[test]
    fn relationship_targets_control_slide_order() {
        let mut parts = read_package(FIXTURE).unwrap();
        let path = "ppt/_rels/presentation.xml.rels";
        let rels = String::from_utf8(parts[path].clone())
            .unwrap()
            .replace("slides/slide1.xml", "slides/temporary.xml")
            .replace("slides/slide2.xml", "slides/slide1.xml")
            .replace("slides/temporary.xml", "slides/slide2.xml");
        parts.insert(path.into(), rels.into_bytes());
        let imported = parse_pptx(&write_package(parts).unwrap()).unwrap();
        assert!(imported.scene.slides[0].elements.iter().any(
            |e| matches!(&e.kind,SceneKind::Text{text,..} if text=="Inherited title geometry")
        ));
    }
    #[test]
    fn rejects_dtd_and_package_traversal() {
        let mut parts = read_package(FIXTURE).unwrap();
        let xml = String::from_utf8(parts["ppt/slides/slide1.xml"].clone()).unwrap();
        let xml = xml.replace(
            "<p:sld ",
            "<!DOCTYPE sld [<!ENTITY evil 'expanded'>]><p:sld ",
        );
        parts.insert("ppt/slides/slide1.xml".into(), xml.into_bytes());
        assert!(parse_pptx(&write_package(parts).unwrap()).is_err());
        let mut parts = read_package(FIXTURE).unwrap();
        parts.insert("../escape.xml".into(), b"unsafe".to_vec());
        assert!(parse_pptx(&write_package(parts).unwrap()).is_err());
    }
    #[test]
    fn detects_unsupported_animation() {
        let mut parts = read_package(FIXTURE).unwrap();
        let xml = String::from_utf8(parts["ppt/slides/slide1.xml"].clone())
            .unwrap()
            .replace("</p:sld>", "<p:timing/></p:sld>");
        parts.insert("ppt/slides/slide1.xml".into(), xml.into_bytes());
        let imported = parse_pptx(&write_package(parts).unwrap()).unwrap();
        assert!(imported
            .diagnostics
            .iter()
            .any(|d| d.code == "unsupportedAnimation"));
    }
    #[test]
    fn rejects_excessive_group_depth() {
        let mut parts = read_package(FIXTURE).unwrap();
        let xml = String::from_utf8(parts["ppt/slides/slide1.xml"].clone()).unwrap();
        let xml = xml
            .replace(
                "<p:spTree>",
                &format!("<p:spTree>{}", "<p:grpSp>".repeat(66)),
            )
            .replace(
                "</p:spTree>",
                &format!("{}</p:spTree>", "</p:grpSp>".repeat(66)),
            );
        parts.insert("ppt/slides/slide1.xml".into(), xml.into_bytes());
        let error = parse_pptx(&write_package(parts).unwrap()).unwrap_err();
        assert_eq!(error.reason, "resourceLimit");
    }
}
