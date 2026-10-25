//! Portable authoring documents and resolved slide scenes. All distances are points.
mod resource_limits;
use base64::{engine::general_purpose::STANDARD, Engine};
pub use resource_limits::{resource_limit, ResourceLimits};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, HashSet};

/// Expected failures cross native and WASM boundaries as serializable values.
#[derive(JsonSchema, Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct LipatError {
    pub reason: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub node_id: Option<String>,
}
impl LipatError {
    pub fn new(reason: &str, message: impl Into<String>) -> Self {
        Self {
            reason: reason.into(),
            message: message.into(),
            node_id: None,
        }
    }
}
pub type Result<T> = std::result::Result<T, LipatError>;
#[derive(JsonSchema, Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Diagnostic {
    pub code: String,
    pub severity: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub slide_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub node_id: Option<String>,
}
impl Diagnostic {
    pub fn warning(
        code: &str,
        message: impl Into<String>,
        slide_id: Option<String>,
        node_id: Option<String>,
    ) -> Self {
        Self {
            code: code.into(),
            severity: "warning".into(),
            message: message.into(),
            slide_id,
            node_id,
        }
    }
}
#[derive(JsonSchema, Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Size {
    pub width: f64,
    pub height: f64,
}
impl Default for Size {
    fn default() -> Self {
        Self {
            width: 960.,
            height: 540.,
        }
    }
}
#[derive(JsonSchema, Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Frame {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    #[serde(default)]
    pub rotation: f64,
}
#[derive(JsonSchema, Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Theme {
    pub font_family: String,
    pub font_size: f64,
    pub heading_size: f64,
    pub foreground: String,
    pub background: String,
    pub accent: String,
    pub padding: f64,
    pub gap: f64,
}
impl Default for Theme {
    fn default() -> Self {
        Self {
            font_family: "Arial".into(),
            font_size: 24.,
            heading_size: 48.,
            foreground: "#172033".into(),
            background: "#FFFFFF".into(),
            accent: "#5B5BD6".into(),
            padding: 48.,
            gap: 24.,
        }
    }
}
#[derive(JsonSchema, Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct TextStyle {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub font_family: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub font_size: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub bold: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub italic: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub underline: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub align: Option<String>,
}
#[derive(JsonSchema, Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct TextRun {
    pub text: String,
    #[serde(default)]
    pub style: TextStyle,
}
#[derive(JsonSchema, Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(untagged)]
pub enum TextContent {
    Plain(String),
    Rich(Vec<TextRun>),
}
impl TextContent {
    pub fn text(&self) -> String {
        match self {
            Self::Plain(s) => s.clone(),
            Self::Rich(r) => r.iter().map(|r| r.text.as_str()).collect(),
        }
    }
    pub fn runs(&self) -> Vec<TextRun> {
        match self {
            Self::Plain(s) => vec![TextRun {
                text: s.clone(),
                style: TextStyle::default(),
            }],
            Self::Rich(r) => r.clone(),
        }
    }
}
#[derive(JsonSchema, Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Node {
    pub id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub frame: Option<Frame>,
    #[serde(default)]
    pub style: TextStyle,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[schemars(range(max = 10000))]
    pub step: Option<u32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub animation: Option<EntranceAnimation>,
    #[serde(flatten)]
    pub kind: NodeKind,
}
/// Portable entrance effects; milliseconds are serialized, never executable Motion props.
#[derive(JsonSchema, Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct EntranceAnimation {
    pub effect: EntranceEffect,
    #[serde(default = "default_animation_duration")]
    #[schemars(range(min = 0, max = 10000))]
    pub duration_ms: f64,
    #[serde(default)]
    #[schemars(range(min = 0, max = 60000))]
    pub delay_ms: f64,
    #[serde(default)]
    pub easing: AnimationEasing,
}
fn default_animation_duration() -> f64 {
    350.
}
#[derive(JsonSchema, Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum EntranceEffect {
    Fade,
    Rise,
    Slide,
    Zoom,
}
#[derive(JsonSchema, Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub enum AnimationEasing {
    #[default]
    EaseOut,
    EaseInOut,
    Linear,
}
fn default_level() -> u8 {
    1
}
fn default_fit() -> String {
    "contain".into()
}
fn default_geometry() -> String {
    "rect".into()
}
/// Exactly one image source, serialized inline as assetId or an absolute HTTP(S) URL.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(untagged, try_from = "ImageSourceWire")]
pub enum ImageSource {
    Asset {
        #[serde(rename = "assetId")]
        asset_id: String,
    },
    Url {
        url: String,
    },
}
impl JsonSchema for ImageSource {
    fn schema_name() -> String {
        "ImageSource".into()
    }
    fn json_schema(_: &mut schemars::gen::SchemaGenerator) -> schemars::schema::Schema {
        serde_json::from_value(serde_json::json!({
            "description": "Exactly one embedded assetId or absolute HTTP(S) image URL",
            "oneOf": [
                { "type":"object", "properties": {"assetId":{"type":"string"}}, "required":["assetId"] },
                { "type":"object", "properties": {"url":{"type":"string","format":"uri","maxLength":8192,"pattern":"^[hH][tT][tT][pP][sS]?://"}}, "required":["url"] }
            ]
        })).expect("Image source schema is valid")
    }
}
#[derive(Deserialize)]
struct ImageSourceWire {
    #[serde(default, rename = "assetId")]
    asset_id: Option<String>,
    #[serde(default)]
    url: Option<String>,
}
impl TryFrom<ImageSourceWire> for ImageSource {
    type Error = String;
    fn try_from(wire: ImageSourceWire) -> std::result::Result<Self, Self::Error> {
        match (wire.asset_id, wire.url) {
            (Some(asset_id), None) => Ok(Self::Asset { asset_id }),
            (None, Some(url)) => Ok(Self::Url { url }),
            _ => Err("Image source requires exactly one of assetId or url".into()),
        }
    }
}
impl ImageSource {
    /// Resolve an embedded asset identity without treating URL sources as missing assets.
    pub fn asset_id(&self) -> Option<&str> {
        match self {
            Self::Asset { asset_id } => Some(asset_id),
            Self::Url { .. } => None,
        }
    }
}
/// URLs remain opaque source data; validating them never performs a network request.
pub fn check_image_url(value: &str) -> Result<()> {
    if value.len() > 8192
        || !(value.to_ascii_lowercase().starts_with("http://")
            || value.to_ascii_lowercase().starts_with("https://"))
        || value.chars().any(|c| c.is_control() || c.is_whitespace())
    {
        return Err(LipatError::new(
            "invalidDocument",
            "Image URL must be HTTP(S), without whitespace or credentials",
        ));
    }
    let parsed = url::Url::parse(value)
        .map_err(|_| LipatError::new("invalidDocument", "Image URL must be absolute HTTP(S)"))?;
    if !matches!(parsed.scheme(), "http" | "https")
        || parsed.host_str().is_none()
        || !parsed.username().is_empty()
        || parsed.password().is_some()
    {
        return Err(LipatError::new(
            "invalidDocument",
            "Image URL must be HTTP(S), without whitespace or credentials",
        ));
    }
    Ok(())
}
#[derive(JsonSchema, Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum NodeKind {
    Heading {
        text: TextContent,
        #[serde(default = "default_level")]
        level: u8,
    },
    Text {
        text: TextContent,
    },
    List {
        items: Vec<String>,
        #[serde(default)]
        ordered: bool,
    },
    Image {
        #[serde(flatten)]
        source: ImageSource,
        #[serde(default)]
        alt: String,
        #[serde(default = "default_fit")]
        fit: String,
    },
    Shape {
        #[serde(default = "default_geometry")]
        geometry: String,
        #[serde(default)]
        fill: Option<String>,
        #[serde(default)]
        stroke: Option<String>,
    },
    Table {
        columns: Vec<String>,
        rows: Vec<Vec<String>>,
    },
    Code {
        text: String,
        #[serde(default)]
        language: String,
    },
    Stack {
        children: Vec<Node>,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        gap: Option<f64>,
    },
    Row {
        children: Vec<Node>,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        gap: Option<f64>,
    },
    Grid {
        columns: usize,
        children: Vec<Node>,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        gap: Option<f64>,
    },
    Canvas {
        children: Vec<Node>,
    },
}
impl Node {
    pub fn children(&self) -> Option<&[Node]> {
        match &self.kind {
            NodeKind::Stack { children, .. }
            | NodeKind::Row { children, .. }
            | NodeKind::Grid { children, .. }
            | NodeKind::Canvas { children } => Some(children),
            _ => None,
        }
    }
    pub fn children_mut(&mut self) -> Option<&mut Vec<Node>> {
        match &mut self.kind {
            NodeKind::Stack { children, .. }
            | NodeKind::Row { children, .. }
            | NodeKind::Grid { children, .. }
            | NodeKind::Canvas { children } => Some(children),
            _ => None,
        }
    }
}
#[derive(JsonSchema, Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Slide {
    pub id: String,
    #[serde(default)]
    pub title: String,
    pub content: Node,
    #[serde(default)]
    pub notes: String,
    #[serde(default)]
    pub hidden: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub background: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub parent_id: Option<String>,
}
#[derive(JsonSchema, Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Asset {
    pub id: String,
    pub mime_type: String,
    pub data: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub width: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub height: Option<f64>,
}
#[derive(JsonSchema, Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct DeckDocument {
    #[serde(default = "version_one")]
    pub version: u32,
    pub id: String,
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub size: Size,
    #[serde(default)]
    pub theme: Theme,
    #[serde(default)]
    pub assets: Vec<Asset>,
    pub slides: Vec<Slide>,
}
#[derive(JsonSchema, Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SceneElement {
    pub id: String,
    pub frame: Frame,
    #[serde(default)]
    pub style: TextStyle,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[schemars(range(max = 10000))]
    pub step: Option<u32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub animation: Option<EntranceAnimation>,
    #[serde(flatten)]
    pub kind: SceneKind,
}
#[derive(JsonSchema, Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum SceneKind {
    Text {
        text: String,
        runs: Vec<TextRun>,
        lines: Vec<String>,
        #[serde(rename = "lineHeight", default = "default_line_height")]
        line_height: f64,
    },
    Shape {
        geometry: String,
        fill: Option<String>,
        stroke: Option<String>,
    },
    Image {
        #[serde(flatten)]
        source: ImageSource,
        alt: String,
        fit: String,
    },
    Table {
        columns: Vec<String>,
        rows: Vec<Vec<String>>,
    },
}
#[derive(JsonSchema, Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SceneSlide {
    pub id: String,
    pub title: String,
    pub notes: String,
    pub hidden: bool,
    pub background: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub parent_id: Option<String>,
    pub elements: Vec<SceneElement>,
}
#[derive(JsonSchema, Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SlideScene {
    pub version: u32,
    pub title: String,
    pub size: Size,
    pub assets: Vec<Asset>,
    pub slides: Vec<SceneSlide>,
}
#[derive(JsonSchema, Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CompileOutput {
    pub scene: SlideScene,
    pub diagnostics: Vec<Diagnostic>,
}
#[derive(JsonSchema, Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct FontMetrics {
    pub family: String,
    pub average_width: f64,
    pub line_height: f64,
    #[serde(default)]
    pub glyph_widths: BTreeMap<String, f64>,
}
#[derive(JsonSchema, Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct CompileOptions {
    #[serde(default)]
    pub fonts: Vec<FontMetrics>,
}
fn id_valid(id: &str) -> bool {
    !id.is_empty() && id.len() <= 256
}
fn color_valid(color: &str) -> bool {
    color.len() == 7 && color.starts_with('#') && color[1..].bytes().all(|c| c.is_ascii_hexdigit())
}
pub fn check_frame(f: Frame) -> Result<()> {
    if [f.x, f.y, f.width, f.height, f.rotation]
        .iter()
        .any(|v| !v.is_finite() || v.abs() > 1e7)
        || f.width < 0.
        || f.height < 0.
    {
        return Err(LipatError::new("invalidDocument", "Invalid element frame"));
    }
    Ok(())
}
pub fn check_style(s: &TextStyle) -> Result<()> {
    if s.font_family
        .as_ref()
        .is_some_and(|family| family.len() > 1024)
        || s.font_size
            .is_some_and(|v| !v.is_finite() || v <= 0. || v > 4000.)
        || s.color.as_ref().is_some_and(|v| !color_valid(v))
        || s.align
            .as_ref()
            .is_some_and(|v| !matches!(v.as_str(), "left" | "center" | "right" | "justify"))
    {
        return Err(LipatError::new("invalidDocument", "Invalid text style"));
    }
    Ok(())
}
fn check_asset_budget(assets: &[Asset], limits: &ResourceLimits) -> Result<()> {
    let mut total = 0usize;
    for asset in assets {
        let length = (asset.data.len().saturating_mul(3) / 4).saturating_sub(
            if asset.data.ends_with("==") {
                2
            } else if asset.data.ends_with('=') {
                1
            } else {
                0
            },
        );
        total = total.saturating_add(length);
        if total > limits.max_asset_bytes {
            return Err(resource_limit("maxAssetBytes"));
        }
    }
    Ok(())
}
/// Validate every serialized document boundary, including rehydration and edits.
pub fn check_document(doc: &DeckDocument) -> Result<()> {
    check_document_with_limits(doc, &ResourceLimits::default())
}
/// Validate source while consuming the host's document, text, table and asset budgets.
pub fn check_document_with_limits(doc: &DeckDocument, limits: &ResourceLimits) -> Result<()> {
    limits.check()?;
    check_asset_budget(&doc.assets, limits)?;
    if doc.slides.len() > limits.max_slides {
        return Err(resource_limit("maxSlides"));
    }
    if doc.version != 1 || !id_valid(&doc.id) || doc.slides.is_empty() || doc.slides.len() > 10000 {
        return Err(LipatError::new(
            "invalidDocument",
            "Expected version 1, a deck identity and 1–10000 slides",
        ));
    }
    if [doc.size.width, doc.size.height]
        .iter()
        .any(|v| !v.is_finite() || *v <= 0. || *v > 1e7)
    {
        return Err(LipatError::new("invalidDocument", "Invalid slide size"));
    }
    let t = &doc.theme;
    if t.font_family.len() > 1024
        || !color_valid(&t.background)
        || !color_valid(&t.foreground)
        || !color_valid(&t.accent)
        || [t.font_size, t.heading_size]
            .iter()
            .any(|v| !v.is_finite() || *v <= 0. || *v > 4000.)
        || [t.padding, t.gap].iter().any(|v| !v.is_finite() || *v < 0.)
    {
        return Err(LipatError::new("invalidDocument", "Invalid theme"));
    }
    let mut assets = HashSet::new();
    let mut asset_bytes = 0;
    for a in &doc.assets {
        if !id_valid(&a.id)
            || !assets.insert(a.id.clone())
            || !matches!(
                a.mime_type.as_str(),
                "image/png" | "image/jpeg" | "image/gif" | "image/webp"
            )
        {
            return Err(LipatError::new(
                "invalidDocument",
                "Invalid or duplicate raster asset",
            ));
        }
        let bytes = STANDARD
            .decode(&a.data)
            .map_err(|_| LipatError::new("invalidDocument", "Invalid base64 image asset"))?;
        asset_bytes += bytes.len();
        if asset_bytes > limits.max_asset_bytes {
            return Err(resource_limit("maxAssetBytes"));
        }
        if [a.width, a.height]
            .into_iter()
            .flatten()
            .any(|v| !v.is_finite() || v <= 0.)
        {
            return Err(LipatError::new(
                "invalidDocument",
                "Invalid asset dimensions",
            ));
        }
    }
    let mut slide_ids = HashSet::new();
    let mut node_ids = HashSet::new();
    let mut count = 0;
    let mut table_cells = 0;
    for s in &doc.slides {
        if !id_valid(&s.id)
            || !slide_ids.insert(s.id.clone())
            || s.background.as_ref().is_some_and(|c| !color_valid(c))
        {
            return Err(LipatError::new(
                "invalidDocument",
                "Invalid or duplicate slide identity or background",
            ));
        }
        check_node(
            &s.content,
            &assets,
            &mut node_ids,
            &mut count,
            0,
            limits,
            &mut table_cells,
        )?;
    }
    for (index, s) in doc.slides.iter().enumerate() {
        if let Some(parent) = &s.parent_id {
            if !doc.slides[..index]
                .iter()
                .any(|p| &p.id == parent && p.parent_id.is_none())
            {
                return Err(LipatError::new(
                    "invalidDocument",
                    "A vertical slide must reference an earlier top-level slide",
                ));
            }
        }
    }
    Ok(())
}
fn check_node(
    n: &Node,
    assets: &HashSet<String>,
    ids: &mut HashSet<String>,
    count: &mut usize,
    depth: usize,
    limits: &ResourceLimits,
    table_cells: &mut usize,
) -> Result<()> {
    *count += 1;
    if depth > limits.max_depth {
        return Err(resource_limit("maxDepth"));
    }
    if *count > limits.max_nodes {
        return Err(resource_limit("maxNodes"));
    }
    if !id_valid(&n.id) || !ids.insert(n.id.clone()) {
        return Err(LipatError::new(
            "invalidDocument",
            "Node identities must be unique across the deck",
        ));
    }
    if let Some(f) = n.frame {
        check_frame(f)?;
    }
    check_style(&n.style)?;
    if n.step.is_some_and(|step| step > 10000) {
        return Err(LipatError::new(
            "resourceLimit",
            "Reveal step must be between 0 and 10000",
        ));
    }
    if let Some(animation) = &n.animation {
        if n.children().is_some()
            || !animation.duration_ms.is_finite()
            || !(0. ..=10000.).contains(&animation.duration_ms)
            || !animation.delay_ms.is_finite()
            || !(0. ..=60000.).contains(&animation.delay_ms)
        {
            let mut error = LipatError::new(
                "invalidDocument",
                "Entrance animations require a leaf node, duration 0–10000 ms and delay 0–60000 ms",
            );
            error.node_id = Some(n.id.clone());
            return Err(error);
        }
    }
    let check_text = |text: &TextContent| -> Result<()> {
        let length = match text {
            TextContent::Plain(text) => text.len(),
            TextContent::Rich(runs) => runs.iter().map(|r| r.text.len()).sum(),
        };
        if length > limits.max_text_bytes {
            return Err(resource_limit("maxTextBytes"));
        }
        if let TextContent::Rich(runs) = text {
            for r in runs {
                check_style(&r.style)?;
            }
        }
        Ok(())
    };
    let text_length = match &n.kind {
        NodeKind::List { items, .. } => {
            if items.len() > limits.max_text_lines {
                return Err(resource_limit("maxTextLines"));
            }
            items.iter().map(|s| s.len()).sum()
        }
        NodeKind::Code { text, .. } => text.len(),
        NodeKind::Table { columns, rows } => {
            let cells = columns.len().saturating_mul(rows.len().saturating_add(1));
            *table_cells = table_cells.saturating_add(cells);
            if *table_cells > limits.max_table_cells {
                return Err(resource_limit("maxTableCells"));
            }
            columns
                .iter()
                .chain(rows.iter().flatten())
                .map(|s| s.len())
                .sum()
        }
        _ => 0,
    };
    if text_length > limits.max_text_bytes {
        return Err(resource_limit("maxTextBytes"));
    }
    match &n.kind {
        NodeKind::Heading { text, level } => {
            if !(1..=6).contains(level) {
                return Err(LipatError::new(
                    "invalidDocument",
                    "Heading level must be 1–6",
                ));
            }
            check_text(text)?;
        }
        NodeKind::Text { text } => check_text(text)?,
        NodeKind::Image { source, fit, .. } => {
            match source {
                ImageSource::Asset { asset_id } if !assets.contains(asset_id) => {
                    return Err(LipatError::new("invalidDocument", "Missing image asset"));
                }
                ImageSource::Url { url } => check_image_url(url)?,
                _ => {}
            }
            if !matches!(fit.as_str(), "contain" | "cover" | "stretch") {
                return Err(LipatError::new(
                    "invalidDocument",
                    "Missing image asset or invalid image fit",
                ));
            }
        }
        NodeKind::Shape {
            geometry,
            fill,
            stroke,
        } => {
            if !matches!(geometry.as_str(), "rect" | "roundRect" | "ellipse" | "line")
                || fill.iter().chain(stroke.iter()).any(|v| !color_valid(v))
            {
                return Err(LipatError::new(
                    "invalidDocument",
                    "Invalid shape geometry or color",
                ));
            }
        }
        NodeKind::Table { columns, rows } => {
            if columns.is_empty()
                || columns.len() > 1000
                || rows.len() > 10000
                || rows.iter().any(|r| r.len() != columns.len())
            {
                return Err(LipatError::new(
                    "invalidDocument",
                    "Table cells must match the column count",
                ));
            }
        }
        NodeKind::Stack { gap, .. } | NodeKind::Row { gap, .. } | NodeKind::Grid { gap, .. }
            if gap.is_some_and(|gap| !gap.is_finite() || gap < 0.) =>
        {
            return Err(LipatError::new(
                "invalidDocument",
                "Layout gap must be nonnegative",
            ));
        }
        _ => {}
    }
    if let NodeKind::Grid { columns, .. } = &n.kind {
        if *columns == 0 || *columns > 1000 {
            return Err(LipatError::new(
                "invalidDocument",
                "Grid columns must be 1–1000",
            ));
        }
    }
    if let Some(children) = n.children() {
        for c in children {
            if matches!(n.kind, NodeKind::Canvas { .. }) && c.frame.is_none() {
                return Err(LipatError::new(
                    "invalidDocument",
                    "Canvas children require explicit frames",
                ));
            }
            check_node(c, assets, ids, count, depth + 1, limits, table_cells)?;
        }
    }
    Ok(())
}
/// Validate a scene before native or WASM export.
pub fn check_scene(scene: &SlideScene) -> Result<()> {
    check_scene_with_limits(scene, &ResourceLimits::default())
}
/// Check resolved scenes under the same host budgets before export or authoring conversion.
pub fn check_scene_with_limits(scene: &SlideScene, limits: &ResourceLimits) -> Result<()> {
    limits.check()?;
    check_asset_budget(&scene.assets, limits)?;
    if scene.slides.len() > limits.max_slides {
        return Err(resource_limit("maxSlides"));
    }
    if scene.slides.iter().map(|s| s.elements.len()).sum::<usize>() > limits.max_scene_elements {
        return Err(resource_limit("maxSceneElements"));
    }
    if scene.version != 1 || scene.slides.is_empty() {
        return Err(LipatError::new(
            "invalidScene",
            "Expected version 1 with at least one slide",
        ));
    }
    let mut table_cells = 0usize;
    for slide in &scene.slides {
        for element in &slide.elements {
            if let SceneKind::Table { columns, rows } = &element.kind {
                table_cells = table_cells
                    .saturating_add(columns.len().saturating_mul(rows.len().saturating_add(1)));
                if table_cells > limits.max_table_cells {
                    return Err(resource_limit("maxTableCells"));
                }
                let text_bytes: usize = columns
                    .iter()
                    .chain(rows.iter().flatten())
                    .map(|text| text.len())
                    .sum();
                if text_bytes > limits.max_text_bytes {
                    return Err(resource_limit("maxTextBytes"));
                }
            }
            if let SceneKind::Text {
                text,
                runs,
                lines,
                line_height,
            } = &element.kind
            {
                if text.len() > limits.max_text_bytes
                    || runs.iter().map(|run| run.text.len()).sum::<usize>() > limits.max_text_bytes
                {
                    return Err(resource_limit("maxTextBytes"));
                }
                if lines.len() > limits.max_text_lines {
                    return Err(resource_limit("maxTextLines"));
                }
                let mut cursor = 0;
                if lines.is_empty() && !text.is_empty() {
                    return Err(LipatError::new(
                        "invalidScene",
                        "Nonempty text requires resolved lines",
                    ));
                }
                for line in lines {
                    let next = text
                        .get(cursor..)
                        .and_then(|rest| rest.find(line))
                        .ok_or_else(|| {
                            LipatError::new(
                                "invalidScene",
                                "Resolved text lines must occur in source order",
                            )
                        })?;
                    cursor += next + line.len();
                }
                if !line_height.is_finite()
                    || *line_height <= 0.
                    || (!runs.is_empty()
                        && runs.iter().map(|r| r.text.as_str()).collect::<String>() != *text)
                {
                    return Err(LipatError::new(
                        "invalidScene",
                        "Invalid text lines, line height or rich text runs",
                    ));
                }
            }
        }
    }
    // The conversion's synthetic canvas roots are not source nodes in the admitted flat scene.
    let source_limits = ResourceLimits {
        max_nodes: ResourceLimits::default().max_nodes,
        max_depth: ResourceLimits::default().max_depth,
        ..*limits
    };
    check_document_with_limits(&scene_to_document(scene), &source_limits)
}
/// Import scene geometry explicitly as editable canvas content without inferring semantics.
pub fn scene_to_document(scene: &SlideScene) -> DeckDocument {
    DeckDocument {
        version: 1,
        id: "imported-deck".into(),
        title: scene.title.clone(),
        size: scene.size,
        theme: Theme {
            padding: 0.,
            ..Theme::default()
        },
        assets: scene.assets.clone(),
        slides: scene
            .slides
            .iter()
            .enumerate()
            .map(|(i, s)| Slide {
                id: s.id.clone(),
                title: s.title.clone(),
                notes: s.notes.clone(),
                hidden: s.hidden,
                background: Some(s.background.clone()),
                parent_id: s.parent_id.clone(),
                content: Node {
                    id: format!("{}-canvas-{i}", s.id),
                    frame: None,
                    style: TextStyle::default(),
                    step: None,
                    animation: None,
                    kind: NodeKind::Canvas {
                        children: s
                            .elements
                            .iter()
                            .map(|e| Node {
                                id: e.id.clone(),
                                frame: Some(e.frame),
                                style: e.style.clone(),
                                step: e.step,
                                animation: e.animation.clone(),
                                kind: match &e.kind {
                                    SceneKind::Text { text, runs, .. } => NodeKind::Text {
                                        text: if runs.is_empty() {
                                            TextContent::Plain(text.clone())
                                        } else {
                                            TextContent::Rich(runs.clone())
                                        },
                                    },
                                    SceneKind::Shape {
                                        geometry,
                                        fill,
                                        stroke,
                                    } => NodeKind::Shape {
                                        geometry: geometry.clone(),
                                        fill: fill.clone(),
                                        stroke: stroke.clone(),
                                    },
                                    SceneKind::Image { source, alt, fit } => NodeKind::Image {
                                        source: source.clone(),
                                        alt: alt.clone(),
                                        fit: fit.clone(),
                                    },
                                    SceneKind::Table { columns, rows } => NodeKind::Table {
                                        columns: columns.clone(),
                                        rows: rows.clone(),
                                    },
                                },
                            })
                            .collect(),
                    },
                },
            })
            .collect(),
    }
}

fn version_one() -> u32 {
    1
}

fn default_line_height() -> f64 {
    28.8
}

/// Infer common raster dimensions without a decoder or host image APIs.
pub fn asset_dimensions(asset: &Asset) -> Option<(f64, f64)> {
    if let Some(pair) = asset.width.zip(asset.height) {
        return Some(pair);
    }
    let bytes = STANDARD.decode(&asset.data).ok()?;
    let pair = if bytes.starts_with(b"\x89PNG\r\n\x1a\n") && bytes.len() >= 24 {
        (
            u32::from_be_bytes(bytes[16..20].try_into().ok()?),
            u32::from_be_bytes(bytes[20..24].try_into().ok()?),
        )
    } else if bytes.starts_with(b"GIF8") && bytes.len() >= 10 {
        (
            u16::from_le_bytes(bytes[6..8].try_into().ok()?) as u32,
            u16::from_le_bytes(bytes[8..10].try_into().ok()?) as u32,
        )
    } else if bytes.starts_with(&[255, 216]) {
        let mut i = 2;
        let mut dimensions = None;
        while i + 8 < bytes.len() {
            if bytes[i] != 255 {
                i += 1;
                continue;
            }
            let marker = bytes[i + 1];
            if marker == 0xd9 || marker == 0xda {
                break;
            }
            if marker == 0xd8 || marker == 0x01 || (0xd0..=0xd7).contains(&marker) {
                i += 2;
                continue;
            }
            let len = u16::from_be_bytes([bytes[i + 2], bytes[i + 3]]) as usize;
            if len < 2 || i + len + 2 > bytes.len() {
                break;
            }
            if matches!(
                marker,
                0xc0 | 0xc1
                    | 0xc2
                    | 0xc3
                    | 0xc5
                    | 0xc6
                    | 0xc7
                    | 0xc9
                    | 0xca
                    | 0xcb
                    | 0xcd
                    | 0xce
                    | 0xcf
            ) {
                dimensions = Some((
                    u16::from_be_bytes([bytes[i + 7], bytes[i + 8]]) as u32,
                    u16::from_be_bytes([bytes[i + 5], bytes[i + 6]]) as u32,
                ));
                break;
            }
            i += len + 2;
        }
        dimensions?
    } else {
        return None;
    };
    if pair.0 == 0 || pair.1 == 0 {
        return None;
    }
    Some((pair.0 as f64, pair.1 as f64))
}
