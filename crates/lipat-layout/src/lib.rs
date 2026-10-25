//! Deterministic layout compiler. Fonts and metrics are explicit, never ambient.
use lipat_model::*;
use std::collections::HashSet;
struct Compiler<'a> {
    theme: &'a Theme,
    fonts: &'a [FontMetrics],
    assets: &'a [Asset],
    diagnostics: Vec<Diagnostic>,
    slide_id: String,
    warned_fonts: HashSet<String>,
    limit_exceeded: bool,
}
impl Compiler<'_> {
    fn diagnostic(&mut self, code: &str, message: impl Into<String>, id: &str) {
        self.diagnostics.push(Diagnostic::warning(
            code,
            message,
            Some(self.slide_id.clone()),
            Some(id.into()),
        ));
    }
    fn style(&self, n: &Node, parent: &TextStyle) -> TextStyle {
        let heading = matches!(n.kind, NodeKind::Heading { .. });
        TextStyle {
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
        }
    }
    fn metrics(&mut self, style: &TextStyle, id: &str) -> (f64, f64) {
        let family = style.font_family.as_deref().unwrap_or("Arial");
        if let Some(f) = self.fonts.iter().find(|f| f.family == family) {
            return (f.average_width, f.line_height);
        }
        if self.warned_fonts.insert(family.into()) {
            self.diagnostic("fontMetricsFallback",format!("Using deterministic approximate metrics for {family}; supply measured metrics for accurate wrapping"),id);
        }
        (0.52, 1.2)
    }
    fn lines(&mut self, text: &str, style: &TextStyle, width: f64, id: &str) -> (Vec<String>, f64) {
        let (average, line_height) = self.metrics(style, id);
        let size = style.font_size.unwrap_or(self.theme.font_size);
        let family = style.font_family.as_deref().unwrap_or("Arial");
        let metric = self.fonts.iter().find(|f| f.family == family);
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
        for paragraph in text.split('\n') {
            let mut current = String::new();
            let mut used = 0.;
            for word in paragraph.split_inclusive(' ') {
                let word_width: f64 = word.chars().map(char_width).sum();
                if used + word_width > width && !current.is_empty() {
                    lines.push(current.trim_end().into());
                    current.clear();
                    used = 0.;
                }
                for ch in word.chars() {
                    let w = char_width(ch);
                    if used + w > width && !current.is_empty() {
                        lines.push(std::mem::take(&mut current));
                        used = 0.;
                    }
                    current.push(ch);
                    used += w;
                }
            }
            lines.push(current.trim_end().into());
        }
        if lines.len() > 10000 {
            self.limit_exceeded = true;
            lines.truncate(10000);
        }
        let height = lines.len() as f64 * size * line_height;
        (lines, height)
    }
    fn natural_height(&mut self, n: &Node, width: f64, parent: &TextStyle) -> f64 {
        if let Some(frame) = n.frame {
            return frame.height;
        }
        let style = self.style(n, parent);
        match &n.kind {
            NodeKind::Heading { text, .. } | NodeKind::Text { text } => {
                self.lines(&text.text(), &style, width, &n.id).1
            }
            NodeKind::Code { text, .. } => self.lines(text, &style, width, &n.id).1,
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
                self.lines(&text, &style, width, &n.id).1
            }
            NodeKind::Stack { children, gap } => {
                let gap = gap.unwrap_or(self.theme.gap);
                children
                    .iter()
                    .map(|c| self.natural_height(c, width, &style))
                    .sum::<f64>()
                    + gap * children.len().saturating_sub(1) as f64
            }
            NodeKind::Row { children, gap } => {
                let gap = gap.unwrap_or(self.theme.gap);
                let w = ((width - gap * children.len().saturating_sub(1) as f64)
                    / children.len().max(1) as f64)
                    .max(0.);
                children
                    .iter()
                    .map(|c| self.natural_height(c, w, &style))
                    .fold(0., f64::max)
            }
            NodeKind::Grid {
                children,
                columns,
                gap,
            } => {
                let gap = gap.unwrap_or(self.theme.gap);
                let w =
                    ((width - gap * columns.saturating_sub(1) as f64) / *columns as f64).max(0.);
                children
                    .chunks(*columns)
                    .map(|row| {
                        row.iter()
                            .map(|c| self.natural_height(c, w, &style))
                            .fold(0., f64::max)
                    })
                    .sum::<f64>()
                    + gap * children.len().div_ceil(*columns).saturating_sub(1) as f64
            }
            NodeKind::Canvas { children } => children
                .iter()
                .filter_map(|c| c.frame.map(|f| f.y + f.height))
                .fold(0., f64::max),
            NodeKind::Image { asset_id, .. } => {
                let a = self.assets.iter().find(|a| &a.id == asset_id);
                match a.and_then(asset_dimensions) {
                    Some((w, h)) => width * h / w,
                    None => width * 0.5625,
                }
            }
            NodeKind::Table { columns, rows } => {
                let w = width / columns.len() as f64;
                std::iter::once(columns)
                    .chain(rows)
                    .map(|r| {
                        r.iter()
                            .map(|cell| self.lines(cell, &style, (w - 16.).max(1.), &n.id).1 + 16.)
                            .fold(0., f64::max)
                    })
                    .sum()
            }
            NodeKind::Shape { .. } => 120.,
        }
    }
    fn place(
        &mut self,
        n: &Node,
        available: Frame,
        parent: &TextStyle,
        inherited_step: Option<u32>,
        out: &mut Vec<SceneElement>,
    ) {
        let style = self.style(n, parent);
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
        if let NodeKind::Image { asset_id, fit, .. } = &n.kind {
            let dims = self
                .assets
                .iter()
                .find(|a| &a.id == asset_id)
                .and_then(asset_dimensions);
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
                    let h = self.natural_height(c, frame.width, &style);
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
                    );
                    y += h + gap;
                }
                if y - gap > frame.y + frame.height + 0.01 {
                    self.diagnostic(
                        "layoutOverflow",
                        "Stack content exceeds the available height",
                        &n.id,
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
                    );
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
                    let h = row
                        .iter()
                        .map(|c| self.natural_height(c, w, &style))
                        .fold(0., f64::max);
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
                        );
                    }
                    y += h + gap;
                }
                if y - gap > frame.y + frame.height + 0.01 {
                    self.diagnostic(
                        "layoutOverflow",
                        "Grid content exceeds the available height",
                        &n.id,
                    );
                }
            }
            NodeKind::Canvas { children } => {
                for c in children {
                    self.place(c, frame, &style, step, out)
                }
            }
            _ => {
                let kind = match &n.kind {
                    NodeKind::Heading { text, .. } | NodeKind::Text { text } => {
                        let plain = text.text();
                        let (lines, height) = self.lines(&plain, &style, frame.width, &n.id);
                        if height > frame.height + 0.01 {
                            self.diagnostic(
                                "textOverflow",
                                format!(
                                    "Text needs {height:.1} points; frame has {:.1}",
                                    frame.height
                                ),
                                &n.id,
                            );
                        }
                        SceneKind::Text {
                            text: plain,
                            runs: text.runs(),
                            line_height: height / lines.len().max(1) as f64,
                            lines,
                        }
                    }
                    NodeKind::Code { text, .. } => {
                        let (lines, height) = self.lines(text, &style, frame.width, &n.id);
                        if height > frame.height + 0.01 {
                            self.diagnostic(
                                "textOverflow",
                                "Code exceeds the available height",
                                &n.id,
                            );
                        }
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
                        let (lines, height) = self.lines(&text, &style, frame.width, &n.id);
                        if height > frame.height + 0.01 {
                            self.diagnostic(
                                "textOverflow",
                                "List exceeds the available height",
                                &n.id,
                            );
                        }
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
                    NodeKind::Image { asset_id, alt, fit } => SceneKind::Image {
                        asset_id: asset_id.clone(),
                        alt: alt.clone(),
                        fit: if fit == "contain"
                            && self
                                .assets
                                .iter()
                                .find(|a| &a.id == asset_id)
                                .and_then(asset_dimensions)
                                .is_some()
                        {
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
    }
}
/// Compile authoring intent into deterministic positioned scenes and actionable diagnostics.
pub fn compile_document(doc: &DeckDocument, options: &CompileOptions) -> Result<CompileOutput> {
    check_document(doc)?;
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
        fonts: &options.fonts,
        assets: &doc.assets,
        diagnostics: vec![],
        slide_id: String::new(),
        warned_fonts: HashSet::new(),
        limit_exceeded: false,
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
        );
        for e in &elements {
            if e.frame.x < 0.
                || e.frame.y < 0.
                || e.frame.x + e.frame.width > doc.size.width + 0.01
                || e.frame.y + e.frame.height > doc.size.height + 0.01
            {
                compiler.diagnostic(
                    "outsideSlide",
                    "Element extends outside the slide bounds",
                    &e.id,
                );
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
    if compiler.limit_exceeded {
        return Err(LipatError::new(
            "resourceLimit",
            "Text layout exceeds 10000 lines in one node",
        ));
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
