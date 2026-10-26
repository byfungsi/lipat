//! Deterministic layout compiler. Fonts and metrics are explicit, never ambient.
use lipat_model::*;
use std::collections::{BTreeMap, HashSet};
struct Compiler<'a> {
    theme: &'a Theme,
    fonts: BTreeMap<&'a str, &'a FontMetrics>,
    assets: BTreeMap<&'a str, &'a Asset>,
    image_dimensions: BTreeMap<String, Option<(f64, f64)>>,
    diagnostics: Vec<Diagnostic>,
    slide_id: String,
    warned_fonts: HashSet<String>,
    limits: ResourceLimits,
    layout_work: usize,
    element_count: usize,
}
impl Compiler<'_> {
    fn charge_work(&mut self, amount: usize) -> Result<()> {
        self.layout_work = self.layout_work.saturating_add(amount);
        if self.layout_work > self.limits.max_layout_work {
            return Err(resource_limit("maxLayoutWork"));
        }
        Ok(())
    }
    fn push_line(&self, lines: &mut Vec<String>, line: String) -> Result<()> {
        if lines.len() >= self.limits.max_text_lines {
            return Err(resource_limit("maxTextLines"));
        }
        lines.push(line);
        Ok(())
    }
    fn image_dimensions(&mut self, source: &ImageSource) -> Result<Option<(f64, f64)>> {
        let Some(id) = source.asset_id() else {
            return Ok(None);
        };
        if let Some(dims) = self.image_dimensions.get(id) {
            return Ok(*dims);
        }
        let Some(asset) = self.assets.get(id).copied() else {
            return Ok(None);
        };
        if asset.width.is_none() || asset.height.is_none() {
            self.charge_work(asset.data.len())?;
        }
        let dims = asset_dimensions(asset);
        self.image_dimensions.insert(id.into(), dims);
        Ok(dims)
    }
    fn diagnostic(&mut self, code: &str, message: impl Into<String>, id: &str) {
        self.diagnostics.push(Diagnostic::warning(
            code,
            message,
            Some(self.slide_id.clone()),
            Some(id.into()),
        ));
    }
    fn measured_diagnostic(
        &mut self,
        code: &str,
        message: impl Into<String>,
        id: &str,
        bounds: DiagnosticBounds,
        recommendations: Vec<DiagnosticRecommendation>,
    ) {
        let mut diagnostic =
            Diagnostic::warning(code, message, Some(self.slide_id.clone()), Some(id.into()));
        diagnostic.bounds = Some(bounds);
        diagnostic.recommendations = recommendations;
        self.diagnostics.push(diagnostic);
    }
    fn text_overflow(&mut self, id: &str, frame: Frame, width: f64, height: f64) {
        if width > frame.width + 0.01 || height > frame.height + 0.01 {
            self.measured_diagnostic("textOverflow", format!("Text needs {width:.1} × {height:.1} points; frame has {:.1} × {:.1}. Enlarge the frame, reduce the font size, or split the content.", frame.width, frame.height), id,
                DiagnosticBounds::new(DiagnosticBoundsKind::Text, Frame { width, height, ..frame }, frame),
                vec![DiagnosticRecommendation::ResizeNode, DiagnosticRecommendation::ReduceFontSize, DiagnosticRecommendation::SplitContent]);
        }
    }
    fn style(&mut self, n: &Node, parent: &TextStyle) -> Result<TextStyle> {
        let family_bytes = n
            .style
            .font_family
            .as_ref()
            .or(parent.font_family.as_ref())
            .unwrap_or(&self.theme.font_family)
            .len();
        self.charge_work(family_bytes)?;
        let heading = matches!(n.kind, NodeKind::Heading { .. });
        Ok(TextStyle {
            font_family: n
                .style
                .font_family
                .clone()
                .or_else(|| parent.font_family.clone())
                .or_else(|| Some(self.theme.font_family.clone())),
            font_size: n
                .style
                .font_size
                .or(if heading {
                    Some(self.theme.heading_size)
                } else {
                    parent.font_size
                })
                .or(Some(self.theme.font_size)),
            color: n
                .style
                .color
                .clone()
                .or_else(|| parent.color.clone())
                .or_else(|| Some(self.theme.foreground.clone())),
            bold: n
                .style
                .bold
                .or(if heading { Some(true) } else { parent.bold }),
            italic: n.style.italic.or(parent.italic),
            underline: n.style.underline.or(parent.underline),
            align: n
                .style
                .align
                .clone()
                .or_else(|| parent.align.clone())
                .or_else(|| Some("left".into())),
        })
    }
    fn metrics(&mut self, style: &TextStyle, id: &str) -> (f64, f64) {
        let family = style.font_family.as_deref().unwrap_or("Arial");
        if let Some(f) = self.fonts.get(family).copied() {
            return (f.average_width, f.line_height);
        }
        if self.warned_fonts.insert(family.into()) {
            self.diagnostic("fontMetricsFallback",format!("Using deterministic approximate metrics for {family}; supply measured metrics for accurate wrapping"),id);
        }
        (0.52, 1.2)
    }
    fn lines(
        &mut self,
        text: &str,
        style: &TextStyle,
        width: f64,
        id: &str,
    ) -> Result<(Vec<String>, f64, f64)> {
        if text.len() > self.limits.max_text_bytes {
            return Err(resource_limit("maxTextBytes"));
        }
        self.charge_work(text.len().saturating_mul(2).saturating_add(1))?;
        let (average, line_height) = self.metrics(style, id);
        let size = style.font_size.unwrap_or(self.theme.font_size);
        let family = style.font_family.as_deref().unwrap_or("Arial");
        let metric = self.fonts.get(family).copied();
        let char_width = |c: char| -> f64 {
            let factor = metric
                .and_then(|f| f.glyph_widths.get(&c.to_string()).copied())
                .unwrap_or(if c.is_whitespace() {
                    average * 0.6
                } else if c.is_ascii() {
                    average
                } else {
                    1.
                });
            factor * size
        };
        let mut lines = Vec::new();
        let mut max_width: f64 = 0.;
        for paragraph in text.split('\n') {
            let mut current = String::new();
            let mut used = 0.;
            let mut visible_width = 0.;
            for word in paragraph.split_inclusive(' ') {
                let word_width: f64 = word.chars().map(char_width).sum();
                if used + word_width > width && !current.is_empty() {
                    self.push_line(&mut lines, current.trim_end().into())?;
                    max_width = max_width.max(visible_width);
                    current.clear();
                    used = 0.;
                    visible_width = 0.;
                }
                for ch in word.chars() {
                    let w = char_width(ch);
                    if used + w > width && !current.is_empty() {
                        self.push_line(&mut lines, std::mem::take(&mut current))?;
                        max_width = max_width.max(visible_width);
                        used = 0.;
                        visible_width = 0.;
                    }
                    current.push(ch);
                    used += w;
                    if !ch.is_whitespace() {
                        visible_width = used;
                    }
                }
            }
            self.push_line(&mut lines, current.trim_end().into())?;
            max_width = max_width.max(visible_width);
        }
        let height = lines.len() as f64 * size * line_height;
        Ok((lines, height, max_width))
    }
    fn natural_height(&mut self, n: &Node, width: f64, parent: &TextStyle) -> Result<f64> {
        self.charge_work(1)?;
        if let Some(frame) = n.frame {
            return Ok(frame.height);
        }
        let style = self.style(n, parent)?;
        Ok(match &n.kind {
            NodeKind::Heading { text, .. } | NodeKind::Text { text } => {
                self.lines(&text.text(), &style, width, &n.id)?.1
            }
            NodeKind::Code { text, .. } => self.lines(text, &style, width, &n.id)?.1,
            NodeKind::List { items, ordered } => {
                let text = items
                    .iter()
                    .enumerate()
                    .map(|(i, s)| {
                        if *ordered {
                            format!("{}. {s}", i + 1)
                        } else {
                            format!("• {s}")
                        }
                    })
                    .collect::<Vec<_>>()
                    .join("\n");
                self.lines(&text, &style, width, &n.id)?.1
            }
            NodeKind::Stack { children, gap } => {
                let mut height =
                    gap.unwrap_or(self.theme.gap) * children.len().saturating_sub(1) as f64;
                for child in children {
                    height += self.natural_height(child, width, &style)?;
                }
                height
            }
            NodeKind::Row { children, gap } => {
                let gap = gap.unwrap_or(self.theme.gap);
                let w = ((width - gap * children.len().saturating_sub(1) as f64)
                    / children.len().max(1) as f64)
                    .max(0.);
                let mut height: f64 = 0.;
                for child in children {
                    height = height.max(self.natural_height(child, w, &style)?);
                }
                height
            }
            NodeKind::Grid {
                children,
                columns,
                gap,
            } => {
                let gap = gap.unwrap_or(self.theme.gap);
                let w =
                    ((width - gap * columns.saturating_sub(1) as f64) / *columns as f64).max(0.);
                let mut height = gap * children.len().div_ceil(*columns).saturating_sub(1) as f64;
                for row in children.chunks(*columns) {
                    let mut row_height: f64 = 0.;
                    for child in row {
                        row_height = row_height.max(self.natural_height(child, w, &style)?);
                    }
                    height += row_height;
                }
                height
            }
            NodeKind::Canvas { children } => children
                .iter()
                .filter_map(|c| c.frame.map(|f| f.y + f.height))
                .fold(0., f64::max),
            NodeKind::Image { source, .. } => match self.image_dimensions(source)? {
                Some((w, h)) => width * h / w,
                None => width * 0.5625,
            },
            NodeKind::Table { columns, rows } => {
                let w = width / columns.len() as f64;
                let mut height = 0.;
                for row in std::iter::once(columns).chain(rows) {
                    let mut row_height: f64 = 0.;
                    for cell in row {
                        row_height = row_height
                            .max(self.lines(cell, &style, (w - 16.).max(1.), &n.id)?.1 + 16.);
                    }
                    height += row_height;
                }
                height
            }
            NodeKind::Shape { .. } => 120.,
            NodeKind::Chart { .. } => width * 0.5625,
        })
    }
    fn place(
        &mut self,
        n: &Node,
        available: Frame,
        parent: &TextStyle,
        inherited_step: Option<u32>,
        out: &mut Vec<SceneElement>,
    ) -> Result<()> {
        self.charge_work(1)?;
        let style = self.style(n, parent)?;
        let step = n.step.or(inherited_step);
        let mut frame = if let Some(f) = n.frame {
            Frame {
                x: available.x + f.x,
                y: available.y + f.y,
                ..f
            }
        } else {
            available
        };
        if let NodeKind::Image { source, fit, .. } = &n.kind {
            let dims = if fit == "stretch" {
                None
            } else {
                self.image_dimensions(source)?
            };
            if let Some((w, h)) = dims {
                if fit == "contain" {
                    let scale = (frame.width / w).min(frame.height / h);
                    let width = w * scale;
                    let height = h * scale;
                    frame.x += (frame.width - width) / 2.;
                    frame.y += (frame.height - height) / 2.;
                    frame.width = width;
                    frame.height = height;
                }
            } else if fit != "stretch" {
                self.diagnostic(
                    "imageDimensionsMissing",
                    "Supply intrinsic image dimensions for consistent fit across export targets",
                    &n.id,
                );
            }
        }
        match &n.kind {
            NodeKind::Stack { children, gap } => {
                let gap = gap.unwrap_or(self.theme.gap);
                let mut y = frame.y;
                for c in children {
                    let h = self.natural_height(c, frame.width, &style)?;
                    self.place(
                        c,
                        Frame {
                            x: frame.x,
                            y,
                            width: frame.width,
                            height: h,
                            rotation: 0.,
                        },
                        &style,
                        step,
                        out,
                    )?;
                    y += h + gap;
                }
                if y - gap > frame.y + frame.height + 0.01 {
                    let height = (y - gap - frame.y).max(0.);
                    self.measured_diagnostic(
                        "layoutOverflow",
                        format!("Stack content needs {height:.1} points; container has {:.1}. Enlarge the container or split content across slides.", frame.height),
                        &n.id,
                        DiagnosticBounds::new(DiagnosticBoundsKind::Layout, Frame { height, ..frame }, frame),
                        vec![DiagnosticRecommendation::ResizeNode, DiagnosticRecommendation::SplitContent],
                    );
                }
            }
            NodeKind::Row { children, gap } => {
                let gap = gap.unwrap_or(self.theme.gap);
                let w = ((frame.width - gap * children.len().saturating_sub(1) as f64)
                    / children.len().max(1) as f64)
                    .max(0.);
                for (i, c) in children.iter().enumerate() {
                    self.place(
                        c,
                        Frame {
                            x: frame.x + i as f64 * (w + gap),
                            width: w,
                            ..frame
                        },
                        &style,
                        step,
                        out,
                    )?;
                }
            }
            NodeKind::Grid {
                children,
                columns,
                gap,
            } => {
                let gap = gap.unwrap_or(self.theme.gap);
                let w = ((frame.width - gap * columns.saturating_sub(1) as f64) / *columns as f64)
                    .max(0.);
                let mut y = frame.y;
                for row in children.chunks(*columns) {
                    let mut h: f64 = 0.;
                    for c in row {
                        h = h.max(self.natural_height(c, w, &style)?);
                    }
                    for (i, c) in row.iter().enumerate() {
                        self.place(
                            c,
                            Frame {
                                x: frame.x + i as f64 * (w + gap),
                                y,
                                width: w,
                                height: h,
                                rotation: 0.,
                            },
                            &style,
                            step,
                            out,
                        )?;
                    }
                    y += h + gap;
                }
                if y - gap > frame.y + frame.height + 0.01 {
                    let height = (y - gap - frame.y).max(0.);
                    self.measured_diagnostic(
                        "layoutOverflow",
                        format!("Grid content needs {height:.1} points; container has {:.1}. Enlarge the container or split content across slides.", frame.height),
                        &n.id,
                        DiagnosticBounds::new(DiagnosticBoundsKind::Layout, Frame { height, ..frame }, frame),
                        vec![DiagnosticRecommendation::ResizeNode, DiagnosticRecommendation::SplitContent],
                    );
                }
            }
            NodeKind::Canvas { children } => {
                for c in children {
                    self.place(c, frame, &style, step, out)?;
                }
            }
            _ => {
                self.element_count += 1;
                if self.element_count > self.limits.max_scene_elements {
                    return Err(resource_limit("maxSceneElements"));
                }
                let kind = match &n.kind {
                    NodeKind::Chart { chart } => SceneKind::Chart {
                        chart: chart.clone(),
                    },
                    NodeKind::Heading { text, .. } | NodeKind::Text { text } => {
                        let plain = text.text();
                        let (lines, height, width) =
                            self.lines(&plain, &style, frame.width, &n.id)?;
                        self.text_overflow(&n.id, frame, width, height);
                        SceneKind::Text {
                            text: plain,
                            runs: text.runs(),
                            line_height: height / lines.len().max(1) as f64,
                            lines,
                        }
                    }
                    NodeKind::Code { text, .. } => {
                        let (lines, height, width) =
                            self.lines(text, &style, frame.width, &n.id)?;
                        self.text_overflow(&n.id, frame, width, height);
                        SceneKind::Text {
                            text: text.clone(),
                            runs: vec![TextRun {
                                text: text.clone(),
                                style: TextStyle::default(),
                            }],
                            line_height: height / lines.len().max(1) as f64,
                            lines,
                        }
                    }
                    NodeKind::List { items, ordered } => {
                        let text = items
                            .iter()
                            .enumerate()
                            .map(|(i, s)| {
                                if *ordered {
                                    format!("{}. {s}", i + 1)
                                } else {
                                    format!("• {s}")
                                }
                            })
                            .collect::<Vec<_>>()
                            .join("\n");
                        let (lines, height, width) =
                            self.lines(&text, &style, frame.width, &n.id)?;
                        self.text_overflow(&n.id, frame, width, height);
                        SceneKind::Text {
                            runs: vec![TextRun {
                                text: text.clone(),
                                style: TextStyle::default(),
                            }],
                            text,
                            line_height: height / lines.len().max(1) as f64,
                            lines,
                        }
                    }
                    NodeKind::Image { source, alt, fit } => SceneKind::Image {
                        source: source.clone(),
                        alt: alt.clone(),
                        fit: if fit == "contain" && self.image_dimensions(source)?.is_some() {
                            "stretch".into()
                        } else {
                            fit.clone()
                        },
                    },
                    NodeKind::Shape {
                        geometry,
                        fill,
                        stroke,
                    } => SceneKind::Shape {
                        geometry: geometry.clone(),
                        fill: fill.clone(),
                        stroke: stroke.clone(),
                    },
                    NodeKind::Table { columns, rows } => SceneKind::Table {
                        columns: columns.clone(),
                        rows: rows.clone(),
                    },
                    _ => unreachable!(),
                };
                out.push(SceneElement {
                    id: n.id.clone(),
                    frame,
                    style,
                    step,
                    animation: n.animation.clone(),
                    kind,
                });
            }
        }
        Ok(())
    }
}
/// Compile authoring intent into deterministic positioned scenes and actionable diagnostics.
pub fn compile_document(doc: &DeckDocument, options: &CompileOptions) -> Result<CompileOutput> {
    compile_document_with_limits(doc, options, &ResourceLimits::default())
}
/// Compile with per-node line limits and a cumulative layout-work budget, checked before expanding text.
pub fn compile_document_with_limits(
    doc: &DeckDocument,
    options: &CompileOptions,
    limits: &ResourceLimits,
) -> Result<CompileOutput> {
    check_document_with_limits(doc, limits)?;
    let metadata_work = options.fonts.iter().fold(doc.assets.len(), |sum, font| {
        sum.saturating_add(font.glyph_widths.len())
            .saturating_add(1)
    });
    if metadata_work > limits.max_layout_work {
        return Err(resource_limit("maxLayoutWork"));
    }
    for f in &options.fonts {
        if !f.average_width.is_finite()
            || f.average_width <= 0.
            || !f.line_height.is_finite()
            || f.line_height <= 0.
            || f.glyph_widths.values().any(|w| !w.is_finite() || *w < 0.)
        {
            return Err(LipatError::new(
                "invalidMetrics",
                "Font metrics must be finite and nonnegative",
            ));
        }
    }
    let mut compiler = Compiler {
        theme: &doc.theme,
        fonts: options
            .fonts
            .iter()
            .fold(BTreeMap::new(), |mut fonts, font| {
                fonts.entry(font.family.as_str()).or_insert(font);
                fonts
            }),
        assets: doc
            .assets
            .iter()
            .map(|asset| (asset.id.as_str(), asset))
            .collect(),
        image_dimensions: BTreeMap::new(),
        diagnostics: vec![],
        slide_id: String::new(),
        warned_fonts: HashSet::new(),
        limits: *limits,
        layout_work: metadata_work,
        element_count: 0,
    };
    let mut slides = vec![];
    for s in &doc.slides {
        compiler.slide_id = s.id.clone();
        let mut elements = vec![];
        let padding = if matches!(s.content.kind, NodeKind::Canvas { .. }) {
            0.
        } else {
            doc.theme.padding
        };
        let frame = Frame {
            x: padding,
            y: padding,
            width: (doc.size.width - 2. * padding).max(0.),
            height: (doc.size.height - 2. * padding).max(0.),
            rotation: 0.,
        };
        compiler.place(
            &s.content,
            frame,
            &TextStyle::default(),
            None,
            &mut elements,
        )?;
        for e in &elements {
            let measured = rotated_bounds(e.frame);
            let available = Frame {
                width: doc.size.width,
                height: doc.size.height,
                ..Frame::default()
            };
            if measured.x < -0.01
                || measured.y < -0.01
                || measured.x + measured.width > doc.size.width + 0.01
                || measured.y + measured.height > doc.size.height + 0.01
            {
                compiler.measured_diagnostic("outsideSlide", "Element extends outside the slide bounds. Move or resize the element to fit the slide.", &e.id,
                    DiagnosticBounds::new(DiagnosticBoundsKind::Slide, measured, available),
                    vec![DiagnosticRecommendation::MoveNode, DiagnosticRecommendation::ResizeNode]);
            }
        }
        slides.push(SceneSlide {
            id: s.id.clone(),
            title: s.title.clone(),
            notes: s.notes.clone(),
            hidden: s.hidden,
            background: s
                .background
                .clone()
                .unwrap_or_else(|| doc.theme.background.clone()),
            parent_id: s.parent_id.clone(),
            elements,
        });
    }
    Ok(CompileOutput {
        scene: SlideScene {
            version: 1,
            title: doc.title.clone(),
            size: doc.size,
            assets: doc.assets.clone(),
            slides,
        },
        diagnostics: compiler.diagnostics,
    })
}

// Scene rotation is around the element center, matching SVG/PPTX rendering.
fn rotated_bounds(frame: Frame) -> Frame {
    let angle = frame.rotation.to_radians();
    let width = frame.width * angle.cos().abs() + frame.height * angle.sin().abs();
    let height = frame.width * angle.sin().abs() + frame.height * angle.cos().abs();
    Frame {
        x: frame.x + (frame.width - width) / 2.,
        y: frame.y + (frame.height - height) / 2.,
        width,
        height,
        rotation: 0.,
    }
}
