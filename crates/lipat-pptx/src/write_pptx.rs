use crate::animation_timing::write_slide_timing;
use crate::package::*;
use base64::{engine::general_purpose::STANDARD, Engine};
use lipat_model::*;
use serde::{Deserialize, Serialize};
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportedPresentation {
    pub bytes: Vec<u8>,
    pub diagnostics: Vec<Diagnostic>,
}
const P: &str = "http://schemas.openxmlformats.org/presentationml/2006/main";
const A: &str = "http://schemas.openxmlformats.org/drawingml/2006/main";
const R: &str = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
fn put(parts: &mut Parts, path: impl Into<String>, xml: String) {
    parts.insert(path.into(), xml.into_bytes());
}
fn rels(items: &[(String, String, String)]) -> String {
    rels_with_external(items, &std::collections::BTreeSet::new())
}
fn rels_with_external(
    items: &[(String, String, String)],
    external: &std::collections::BTreeSet<String>,
) -> String {
    let entries = items
        .iter()
        .map(|(id, kind, target)| {
            let mode = if external.contains(id) {
                " TargetMode=\"External\""
            } else {
                ""
            };
            format!(
                "<Relationship Id=\"{}\" Type=\"{R}/{kind}\" Target=\"{}\"{mode}/>",
                escape_xml(id),
                escape_xml(target)
            )
        })
        .collect::<String>();
    format!("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">{entries}</Relationships>")
}
fn xfrm(f: Frame, prefix: &str) -> String {
    format!("<{prefix}:xfrm rot=\"{}\"><a:off x=\"{}\" y=\"{}\"/><a:ext cx=\"{}\" cy=\"{}\"/></{prefix}:xfrm>",(f.rotation*60000.).round() as i64,(f.x*12700.).round() as i64,(f.y*12700.).round() as i64,(f.width*12700.).round() as i64,(f.height*12700.).round() as i64)
}
fn fill(color: &Option<String>) -> String {
    color
        .as_ref()
        .map(|c| {
            format!(
                "<a:solidFill><a:srgbClr val=\"{}\"/></a:solidFill>",
                escape_xml(c.trim_start_matches('#'))
            )
        })
        .unwrap_or_else(|| "<a:noFill/>".into())
}
fn run_style(style: &TextStyle, tag: &str) -> String {
    format!(
        "<a:{tag} sz=\"{}\" b=\"{}\" i=\"{}\" u=\"{}\">{}<a:latin typeface=\"{}\"/></a:{tag}>",
        (style.font_size.unwrap_or(24.) * 100.).round() as i64,
        u8::from(style.bold.unwrap_or(false)),
        u8::from(style.italic.unwrap_or(false)),
        if style.underline.unwrap_or(false) {
            "sng"
        } else {
            "none"
        },
        fill(&Some(
            style.color.clone().unwrap_or_else(|| "#172033".into())
        )),
        escape_xml(style.font_family.as_deref().unwrap_or("Arial"))
    )
}
fn merged(base: &TextStyle, run: &TextStyle) -> TextStyle {
    TextStyle {
        font_family: run.font_family.clone().or_else(|| base.font_family.clone()),
        font_size: run.font_size.or(base.font_size),
        color: run.color.clone().or_else(|| base.color.clone()),
        bold: run.bold.or(base.bold),
        italic: run.italic.or(base.italic),
        underline: run.underline.or(base.underline),
        align: base.align.clone(),
    }
}
fn paragraphs(text: &str, runs: &[TextRun], style: &TextStyle) -> String {
    let owned = if runs.is_empty() {
        vec![TextRun {
            text: text.into(),
            style: TextStyle::default(),
        }]
    } else {
        runs.to_vec()
    };
    let mut paragraphs = vec![String::new()];
    for run in owned {
        let bits: Vec<&str> = run.text.split('\n').collect();
        for (i, part) in bits.iter().enumerate() {
            if i > 0 {
                paragraphs.push(String::new());
            }
            if !part.is_empty() {
                paragraphs.last_mut().unwrap().push_str(&format!(
                    "<a:r>{}<a:t xml:space=\"preserve\">{}</a:t></a:r>",
                    run_style(&merged(style, &run.style), "rPr"),
                    escape_xml(part)
                ));
            }
        }
    }
    paragraphs
        .iter()
        .map(|p| {
            format!(
                "<a:p><a:pPr algn=\"{}\">{}</a:pPr>{p}{}</a:p>",
                match style.align.as_deref() {
                    Some("center") => "ctr",
                    Some("right") => "r",
                    Some("justify") => "just",
                    _ => "l",
                },
                run_style(style, "defRPr"),
                run_style(style, "endParaRPr")
            )
        })
        .collect()
}
fn resolved_paragraphs(
    text: &str,
    runs: &[TextRun],
    lines: &[String],
    style: &TextStyle,
    line_height: f64,
) -> String {
    let source = if runs.is_empty() {
        vec![TextRun {
            text: text.into(),
            style: TextStyle::default(),
        }]
    } else {
        runs.to_vec()
    };
    let mut offsets = vec![];
    let mut offset = 0;
    for run in &source {
        let start = offset;
        offset += run.text.len();
        offsets.push((start, offset, run));
    }
    let mut cursor = 0;
    let mut resolved = vec![];
    for (index, line) in lines.iter().enumerate() {
        if index > 0 {
            resolved.push(TextRun {
                text: "\n".into(),
                style: TextStyle::default(),
            });
        }
        let start = text[cursor..]
            .find(line)
            .map(|n| cursor + n)
            .unwrap_or(cursor);
        let end = start + line.len();
        for (a, b, run) in &offsets {
            if *b > start && *a < end {
                let left = start.saturating_sub(*a);
                let right = (end - *a).min(run.text.len());
                if let Some(slice) = run.text.get(left..right) {
                    resolved.push(TextRun {
                        text: slice.into(),
                        style: run.style.clone(),
                    });
                }
            }
        }
        cursor = end.min(text.len());
    }
    let output = paragraphs(&lines.join("\n"), &resolved, style);
    output.replace("<a:defRPr", &format!("<a:lnSpc><a:spcPts val=\"{}\"/></a:lnSpc><a:spcBef><a:spcPts val=\"0\"/></a:spcBef><a:spcAft><a:spcPts val=\"0\"/></a:spcAft><a:defRPr", (line_height * 100.).round() as i64))
}
fn image_placement(frame: Frame, fit: &str, asset: Option<&Asset>) -> (Frame, String, bool) {
    let Some((w, h)) = asset.and_then(asset_dimensions) else {
        return (frame, String::new(), fit != "stretch");
    };
    if fit == "contain" {
        let scale = (frame.width / w).min(frame.height / h);
        let width = w * scale;
        let height = h * scale;
        return (
            Frame {
                x: frame.x + (frame.width - width) / 2.,
                y: frame.y + (frame.height - height) / 2.,
                width,
                height,
                ..frame
            },
            String::new(),
            false,
        );
    }
    if fit == "cover" && frame.width > 0. && frame.height > 0. {
        let ratio = w / h;
        let target = frame.width / frame.height;
        let (l, t) = if ratio > target {
            ((1. - target / ratio) / 2., 0.)
        } else {
            (0., (1. - ratio / target) / 2.)
        };
        let crop = format!(
            "<a:srcRect l=\"{}\" r=\"{}\" t=\"{}\" b=\"{}\"/>",
            (l * 100000.).round() as i64,
            (l * 100000.).round() as i64,
            (t * 100000.).round() as i64,
            (t * 100000.).round() as i64
        );
        return (frame, crop, false);
    }
    (frame, String::new(), false)
}
fn group_start() -> String {
    "<p:nvGrpSpPr><p:cNvPr id=\"1\" name=\"\"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x=\"0\" y=\"0\"/><a:ext cx=\"0\" cy=\"0\"/><a:chOff x=\"0\" y=\"0\"/><a:chExt cx=\"0\" cy=\"0\"/></a:xfrm></p:grpSpPr>".into()
}
/// Export a canonical scene as an interoperable PPTX; arbitrary source parts are not preserved.
pub fn write_pptx(scene: &SlideScene) -> Result<ExportedPresentation> {
    check_scene(scene)?;
    let total_steps: u64 = scene
        .slides
        .iter()
        .map(|slide| {
            slide
                .elements
                .iter()
                .map(|element| element.step.unwrap_or(0) as u64)
                .max()
                .unwrap_or(0)
        })
        .sum();
    if total_steps > 100000 {
        return Err(LipatError::new(
            "resourceLimit",
            "PPTX animation sequences exceed 100000 reveal steps",
        ));
    }
    let mut parts = Parts::new();
    let mut diagnostics = vec![];
    let mut overrides = vec![
        (
            "/ppt/presentation.xml".to_string(),
            "presentationml.presentation.main+xml".to_string(),
        ),
        (
            "/ppt/slideMasters/slideMaster1.xml".into(),
            "presentationml.slideMaster+xml".into(),
        ),
        (
            "/ppt/slideLayouts/slideLayout1.xml".into(),
            "presentationml.slideLayout+xml".into(),
        ),
        ("/ppt/theme/theme1.xml".into(), "theme+xml".into()),
    ];
    let mut media = std::collections::BTreeMap::new();
    for (i, asset) in scene.assets.iter().enumerate() {
        let ext = match asset.mime_type.as_str() {
            "image/jpeg" => "jpg",
            "image/gif" => "gif",
            "image/webp" => "webp",
            _ => "png",
        };
        let path = format!("media/image{}.{ext}", i + 1);
        parts.insert(
            format!("ppt/{path}"),
            STANDARD
                .decode(&asset.data)
                .map_err(|_| LipatError::new("invalidScene", "Invalid base64 asset"))?,
        );
        media.insert(asset.id.clone(), path);
    }
    for (i, s) in scene.slides.iter().enumerate() {
        let steps: std::collections::BTreeSet<_> = s
            .elements
            .iter()
            .filter_map(|e| e.step.filter(|step| *step > 0))
            .collect();
        if steps
            .last()
            .is_some_and(|last| *last as usize > steps.len())
        {
            diagnostics.push(Diagnostic::warning("emptyAnimationStep", "Empty reveal steps are timing placeholders; some presentation applications compact them", Some(s.id.clone()), None));
        }
        let mut elements = String::new();
        let mut slide_rels = vec![(
            "rIdLayout".into(),
            "slideLayout".into(),
            "../slideLayouts/slideLayout1.xml".into(),
        )];
        let mut external_image_rels = std::collections::BTreeSet::new();
        for (j, e) in s.elements.iter().enumerate() {
            let id = j + 2;
            let name = escape_xml(&e.id);
            match &e.kind{
 SceneKind::Text{text,runs,lines,line_height}=>elements.push_str(&format!("<p:sp><p:nvSpPr><p:cNvPr id=\"{id}\" name=\"{name}\"/><p:cNvSpPr txBox=\"1\"/><p:nvPr/></p:nvSpPr><p:spPr>{}<a:prstGeom prst=\"rect\"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr wrap=\"none\" lIns=\"0\" rIns=\"0\" tIns=\"0\" bIns=\"0\"/><a:lstStyle/>{}</p:txBody></p:sp>",xfrm(e.frame,"a"),resolved_paragraphs(text,runs,lines,&e.style,*line_height))),
 SceneKind::Shape{geometry,fill:shape_fill,stroke}=>elements.push_str(&format!("<p:sp><p:nvSpPr><p:cNvPr id=\"{id}\" name=\"{name}\"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr>{}<a:prstGeom prst=\"{geometry}\"><a:avLst/></a:prstGeom>{}<a:ln>{}</a:ln></p:spPr></p:sp>",xfrm(e.frame,"a"),fill(shape_fill),fill(stroke))),
 SceneKind::Image { source, alt, fit } => {
    let rid = format!("rIdImage{j}");
    let (reference, asset) = match source {
        ImageSource::Asset { asset_id } => {
            let path = media.get(asset_id).ok_or_else(|| LipatError::new("invalidScene", "Missing image asset"))?;
            slide_rels.push((rid.clone(), "image".into(), format!("../{path}")));
            ("embed", scene.assets.iter().find(|a| &a.id == asset_id))
        }
        ImageSource::Url { url } => {
            slide_rels.push((rid.clone(), "image".into(), url.clone()));
            external_image_rels.insert(rid.clone());
            diagnostics.push(Diagnostic::warning("linkedImageExport", "Image URL exported as an external link; embed URL images for offline delivery", Some(s.id.clone()), Some(e.id.clone())));
            ("link", None)
        }
    };
    let (image_frame, crop, missing_dimensions) = image_placement(e.frame, fit, asset);
    if missing_dimensions {
        diagnostics.push(Diagnostic::warning("imageFitFlattened", "Image fit cannot be reproduced without intrinsic raster dimensions", Some(s.id.clone()), Some(e.id.clone())));
    }
    elements.push_str(&format!("<p:pic><p:nvPicPr><p:cNvPr id=\"{id}\" name=\"{name}\" descr=\"{}\"/><p:cNvPicPr><a:picLocks noChangeAspect=\"1\"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:{reference}=\"{rid}\"/>{crop}<a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr>{}<a:prstGeom prst=\"rect\"><a:avLst/></a:prstGeom></p:spPr></p:pic>", escape_xml(alt), xfrm(image_frame, "a")));
 },
 SceneKind::Table{columns,rows}=>{let grid=columns.iter().map(|_|format!("<a:gridCol w=\"{}\"/>",(e.frame.width/columns.len() as f64*12700.).round() as i64)).collect::<String>();let cells=std::iter::once(columns).chain(rows).map(|r|format!("<a:tr h=\"{}\">{}</a:tr>",(e.frame.height/(rows.len()+1) as f64*12700.).round() as i64,r.iter().map(|c|format!("<a:tc><a:txBody><a:bodyPr/><a:lstStyle/>{}</a:txBody><a:tcPr/></a:tc>",paragraphs(c,&[],&e.style))).collect::<String>())).collect::<String>();elements.push_str(&format!("<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id=\"{id}\" name=\"{name}\"/><p:cNvGraphicFramePr/><p:nvPr/></p:nvGraphicFramePr>{}<a:graphic><a:graphicData uri=\"http://schemas.openxmlformats.org/drawingml/2006/table\"><a:tbl><a:tblPr firstRow=\"1\" bandRow=\"1\"/><a:tblGrid>{grid}</a:tblGrid>{cells}</a:tbl></a:graphicData></a:graphic></p:graphicFrame>",xfrm(e.frame,"p")));}
 }
            if e.animation
                .as_ref()
                .is_some_and(|a| a.easing != AnimationEasing::Linear)
            {
                diagnostics.push(Diagnostic::warning("animationEasingApproximation", "PowerPoint uses native acceleration/deceleration in place of the browser cubic-bezier curve", Some(s.id.clone()), Some(e.id.clone())));
            }
            if e.animation.as_ref().is_some_and(|a| {
                a.duration_ms != a.duration_ms.round().max(1.) || a.delay_ms != a.delay_ms.round()
            }) {
                diagnostics.push(Diagnostic::warning("animationTimingQuantized", "PowerPoint animation timing is rounded to whole milliseconds with a minimum 1 ms duration", Some(s.id.clone()), Some(e.id.clone())));
            }
        }
        if !s.notes.is_empty() {
            let n = i + 1;
            slide_rels.push((
                "rIdNotes".into(),
                "notesSlide".into(),
                format!("../notesSlides/notesSlide{n}.xml"),
            ));
            overrides.push((
                format!("/ppt/notesSlides/notesSlide{n}.xml"),
                "presentationml.notesSlide+xml".into(),
            ));
            put(&mut parts,format!("ppt/notesSlides/notesSlide{n}.xml"),format!("<p:notes xmlns:p=\"{P}\" xmlns:a=\"{A}\" xmlns:r=\"{R}\"><p:cSld><p:spTree>{}<p:sp><p:nvSpPr><p:cNvPr id=\"2\" name=\"Notes\"/><p:cNvSpPr/><p:nvPr><p:ph type=\"body\" idx=\"1\"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/>{}</p:txBody></p:sp></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:notes>",group_start(),paragraphs(&s.notes,&[],&TextStyle::default())));
            put(
                &mut parts,
                format!("ppt/notesSlides/_rels/notesSlide{n}.xml.rels"),
                rels(&[(
                    "rIdSlide".into(),
                    "slide".into(),
                    format!("../slides/slide{n}.xml"),
                )]),
            );
        }
        let timing = write_slide_timing(s, scene.size);
        let n = i + 1;
        overrides.push((
            format!("/ppt/slides/slide{n}.xml"),
            "presentationml.slide+xml".into(),
        ));
        put(&mut parts,format!("ppt/slides/slide{n}.xml"),format!("<p:sld xmlns:p=\"{P}\" xmlns:a=\"{A}\" xmlns:r=\"{R}\" show=\"{}\"><p:cSld name=\"{}\"><p:bg><p:bgPr>{}<a:effectLst/></p:bgPr></p:bg><p:spTree>{}{elements}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>{timing}</p:sld>",if s.hidden{0}else{1},escape_xml(&s.title),fill(&Some(s.background.clone())),group_start()));
        put(
            &mut parts,
            format!("ppt/slides/_rels/slide{n}.xml.rels"),
            rels_with_external(&slide_rels, &external_image_rels),
        );
    }
    put(
        &mut parts,
        "_rels/.rels",
        rels(&[(
            "rId1".into(),
            "officeDocument".into(),
            "ppt/presentation.xml".into(),
        )]),
    );
    let root_rels=String::from_utf8(parts["_rels/.rels"].clone()).map_err(|_|LipatError::new("exportFailed","Invalid internal root relationships"))?.replace("</Relationships>","<Relationship Id=\"rIdCore\" Type=\"http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties\" Target=\"docProps/core.xml\"/></Relationships>");
    put(&mut parts, "_rels/.rels", root_rels);
    put(&mut parts,"docProps/core.xml",format!("<cp:coreProperties xmlns:cp=\"http://schemas.openxmlformats.org/package/2006/metadata/core-properties\" xmlns:dc=\"http://purl.org/dc/elements/1.1/\"><dc:title>{}</dc:title><dc:creator>Lipat</dc:creator></cp:coreProperties>",escape_xml(&scene.title)));
    let slide_ids = scene
        .slides
        .iter()
        .enumerate()
        .map(|(i, _)| format!("<p:sldId id=\"{}\" r:id=\"rIdSlide{}\"/>", 256 + i, i + 1))
        .collect::<String>();
    put(&mut parts,"ppt/presentation.xml",format!("<p:presentation xmlns:p=\"{P}\" xmlns:a=\"{A}\" xmlns:r=\"{R}\"><p:sldMasterIdLst><p:sldMasterId id=\"2147483648\" r:id=\"rIdMaster\"/></p:sldMasterIdLst><p:sldIdLst>{slide_ids}</p:sldIdLst><p:sldSz cx=\"{}\" cy=\"{}\"/><p:notesSz cx=\"6858000\" cy=\"9144000\"/></p:presentation>",(scene.size.width*12700.).round() as i64,(scene.size.height*12700.).round() as i64));
    let mut presentation_rels = vec![(
        "rIdMaster".into(),
        "slideMaster".into(),
        "slideMasters/slideMaster1.xml".into(),
    )];
    presentation_rels.extend(scene.slides.iter().enumerate().map(|(i, _)| {
        (
            format!("rIdSlide{}", i + 1),
            "slide".into(),
            format!("slides/slide{}.xml", i + 1),
        )
    }));
    put(
        &mut parts,
        "ppt/_rels/presentation.xml.rels",
        rels(&presentation_rels),
    );
    let clrmap="<p:clrMap bg1=\"lt1\" tx1=\"dk1\" bg2=\"lt2\" tx2=\"dk2\" accent1=\"accent1\" accent2=\"accent2\" accent3=\"accent3\" accent4=\"accent4\" accent5=\"accent5\" accent6=\"accent6\" hlink=\"hlink\" folHlink=\"folHlink\"/>";
    put(&mut parts,"ppt/slideMasters/slideMaster1.xml",format!("<p:sldMaster xmlns:p=\"{P}\" xmlns:a=\"{A}\" xmlns:r=\"{R}\"><p:cSld><p:spTree>{}</p:spTree></p:cSld>{clrmap}<p:sldLayoutIdLst><p:sldLayoutId id=\"2147483649\" r:id=\"rIdLayout\"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles></p:sldMaster>",group_start()));
    put(
        &mut parts,
        "ppt/slideMasters/_rels/slideMaster1.xml.rels",
        rels(&[
            (
                "rIdLayout".into(),
                "slideLayout".into(),
                "../slideLayouts/slideLayout1.xml".into(),
            ),
            (
                "rIdTheme".into(),
                "theme".into(),
                "../theme/theme1.xml".into(),
            ),
        ]),
    );
    put(&mut parts,"ppt/slideLayouts/slideLayout1.xml",format!("<p:sldLayout xmlns:p=\"{P}\" xmlns:a=\"{A}\" xmlns:r=\"{R}\" type=\"blank\" preserve=\"1\"><p:cSld name=\"Blank\"><p:spTree>{}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>",group_start()));
    put(
        &mut parts,
        "ppt/slideLayouts/_rels/slideLayout1.xml.rels",
        rels(&[(
            "rIdMaster".into(),
            "slideMaster".into(),
            "../slideMasters/slideMaster1.xml".into(),
        )]),
    );
    let colors = [
        ("dk1", "172033"),
        ("lt1", "FFFFFF"),
        ("dk2", "344054"),
        ("lt2", "F2F4F7"),
        ("accent1", "5B5BD6"),
        ("accent2", "12B76A"),
        ("accent3", "F79009"),
        ("accent4", "EE46BC"),
        ("accent5", "2E90FA"),
        ("accent6", "7A5AF8"),
        ("hlink", "0000FF"),
        ("folHlink", "800080"),
    ]
    .iter()
    .map(|(name, value)| format!("<a:{name}><a:srgbClr val=\"{value}\"/></a:{name}>"))
    .collect::<String>();
    let solid = "<a:solidFill><a:schemeClr val=\"phClr\"/></a:solidFill>";
    put(&mut parts,"ppt/theme/theme1.xml",format!("<a:theme xmlns:a=\"{A}\" name=\"Lipat\"><a:themeElements><a:clrScheme name=\"Lipat\">{colors}</a:clrScheme><a:fontScheme name=\"Lipat\"><a:majorFont><a:latin typeface=\"Arial\"/><a:ea typeface=\"\"/><a:cs typeface=\"\"/></a:majorFont><a:minorFont><a:latin typeface=\"Arial\"/><a:ea typeface=\"\"/><a:cs typeface=\"\"/></a:minorFont></a:fontScheme><a:fmtScheme name=\"Lipat\"><a:fillStyleLst>{solid}{solid}{solid}</a:fillStyleLst><a:lnStyleLst><a:ln w=\"6350\">{solid}<a:prstDash val=\"solid\"/></a:ln><a:ln w=\"12700\">{solid}<a:prstDash val=\"solid\"/></a:ln><a:ln w=\"19050\">{solid}<a:prstDash val=\"solid\"/></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst>{solid}{solid}{solid}</a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>"));
    let defaults="<Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/><Default Extension=\"xml\" ContentType=\"application/xml\"/><Default Extension=\"png\" ContentType=\"image/png\"/><Default Extension=\"jpg\" ContentType=\"image/jpeg\"/><Default Extension=\"gif\" ContentType=\"image/gif\"/><Default Extension=\"webp\" ContentType=\"image/webp\"/>";
    put(&mut parts,"[Content_Types].xml",format!("<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">{defaults}<Override PartName=\"/docProps/core.xml\" ContentType=\"application/vnd.openxmlformats-package.core-properties+xml\"/>{}</Types>",overrides.iter().map(|(path,kind)|format!("<Override PartName=\"{path}\" ContentType=\"application/vnd.openxmlformats-officedocument.{kind}\"/>")).collect::<String>()));
    Ok(ExportedPresentation {
        bytes: write_package(parts)?,
        diagnostics,
    })
}
