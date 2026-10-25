//! Native PresentationML adapter for the portable entrance-animation and reveal-step model.
use crate::package::*;
use lipat_model::*;
use roxmltree::Node as XmlNode;
use std::collections::{BTreeMap, BTreeSet};

struct TimingWriter {
    next: u32,
}
impl TimingWriter {
    fn id(&mut self) -> u32 {
        let id = self.next;
        self.next += 1;
        id
    }
    fn behavior(
        &mut self,
        shape: usize,
        duration: u64,
        easing: &AnimationEasing,
        attributes: &[&str],
    ) -> String {
        let id = self.id();
        let curve = match easing {
            AnimationEasing::Linear => "",
            AnimationEasing::EaseOut => " decel=\"80000\"",
            AnimationEasing::EaseInOut => " accel=\"50000\" decel=\"50000\"",
        };
        let attrs = if attributes.is_empty() {
            String::new()
        } else {
            format!(
                "<p:attrNameLst>{}</p:attrNameLst>",
                attributes
                    .iter()
                    .map(|attr| format!("<p:attrName>{attr}</p:attrName>"))
                    .collect::<String>()
            )
        };
        format!("<p:cBhvr><p:cTn id=\"{id}\" dur=\"{duration}\" fill=\"hold\"{curve}/><p:tgtEl><p:spTgt spid=\"{shape}\"/></p:tgtEl>{attrs}</p:cBhvr>")
    }
    fn movement(
        &mut self,
        shape: usize,
        duration: u64,
        easing: &AnimationEasing,
        axis: &str,
        delta: f64,
    ) -> String {
        let behavior = self.behavior(shape, duration, easing, &[axis]);
        let expression = if delta < 0. {
            format!("#{axis}{delta:.12}")
        } else {
            format!("#{axis}+{delta:.12}")
        };
        format!("<p:anim calcmode=\"lin\" valueType=\"num\">{behavior}<p:tavLst><p:tav tm=\"0\"><p:val><p:strVal val=\"{expression}\"/></p:val></p:tav><p:tav tm=\"100000\"><p:val><p:strVal val=\"#{axis}\"/></p:val></p:tav></p:tavLst></p:anim>")
    }
    fn entry(
        &mut self,
        element: &SceneElement,
        shape: usize,
        size: Size,
        node_type: &str,
    ) -> String {
        let id = self.id();
        let animation = element.animation.as_ref();
        let duration = animation.map_or(1, |a| a.duration_ms.round().max(1.) as u64);
        let delay = animation.map_or(0, |a| a.delay_ms.round() as u64);
        let (preset, subtype) = match animation.map(|a| &a.effect) {
            None => (1, 0),
            Some(EntranceEffect::Fade) => (10, 0),
            Some(EntranceEffect::Rise) => (2, 4),
            Some(EntranceEffect::Slide) => (2, 8),
            Some(EntranceEffect::Zoom) => (23, 0),
        };
        let visibility = self.behavior(shape, 1, &AnimationEasing::Linear, &["style.visibility"]);
        let mut behaviors =
            format!("<p:set>{visibility}<p:to><p:strVal val=\"visible\"/></p:to></p:set>");
        if let Some(animation) = animation {
            let fade = self.behavior(shape, duration, &animation.easing, &[]);
            behaviors.push_str(&format!(
                "<p:animEffect transition=\"in\" filter=\"fade\">{fade}</p:animEffect>"
            ));
            let radians = element.frame.rotation.to_radians();
            let (dx, dy) = match animation.effect {
                EntranceEffect::Rise => (-24. * radians.sin(), 24. * radians.cos()),
                EntranceEffect::Slide => (-32. * radians.cos(), -32. * radians.sin()),
                _ => (0., 0.),
            };
            if dx.abs() > 1e-9 {
                behaviors.push_str(&self.movement(
                    shape,
                    duration,
                    &animation.easing,
                    "ppt_x",
                    dx / size.width,
                ));
            }
            if dy.abs() > 1e-9 {
                behaviors.push_str(&self.movement(
                    shape,
                    duration,
                    &animation.easing,
                    "ppt_y",
                    dy / size.height,
                ));
            }
            if animation.effect == EntranceEffect::Zoom {
                let behavior = self.behavior(shape, duration, &animation.easing, &[]);
                behaviors.push_str(&format!("<p:animScale zoomContents=\"1\">{behavior}<p:from x=\"95000\" y=\"95000\"/><p:to x=\"100000\" y=\"100000\"/></p:animScale>"));
            }
        }
        format!("<p:par><p:cTn id=\"{id}\" presetID=\"{preset}\" presetClass=\"entr\" presetSubtype=\"{subtype}\" fill=\"hold\" nodeType=\"{node_type}\"><p:stCondLst><p:cond delay=\"{delay}\"/></p:stCondLst><p:childTnLst>{behaviors}</p:childTnLst></p:cTn></p:par>")
    }
}

pub(crate) fn write_slide_timing(slide: &SceneSlide, size: Size) -> String {
    let active: Vec<_> = slide
        .elements
        .iter()
        .enumerate()
        .filter(|(_, e)| e.animation.is_some() || e.step.unwrap_or(0) > 0)
        .collect();
    if active.is_empty() {
        return String::new();
    }
    let max_step = active
        .iter()
        .map(|(_, e)| e.step.unwrap_or(0))
        .max()
        .unwrap_or(0);
    let mut writer = TimingWriter { next: 3 };
    let mut groups = String::new();
    for step in 0..=max_step {
        let entries: Vec<_> = active
            .iter()
            .filter(|(_, e)| e.step.unwrap_or(0) == step)
            .collect();
        if step == 0 && entries.is_empty() {
            continue;
        }
        let group_id = writer.id();
        let inner_id = writer.id();
        let delay = if step == 0 { "0" } else { "indefinite" };
        let mut children = entries
            .iter()
            .enumerate()
            .map(|(index, (shape, element))| {
                let kind = if index > 0 {
                    "withEffect"
                } else if step == 0 {
                    "afterEffect"
                } else {
                    "clickEffect"
                };
                writer.entry(element, shape + 2, size, kind)
            })
            .collect::<String>();
        // A missing reveal step still consumes one click. Empty time-node lists are invalid XML.
        if children.is_empty() {
            let placeholder_id = writer.id();
            children =
                format!("<p:par><p:cTn id=\"{placeholder_id}\" dur=\"1\" fill=\"hold\"/></p:par>");
        }
        groups.push_str(&format!("<p:par><p:cTn id=\"{group_id}\" fill=\"hold\"><p:stCondLst><p:cond delay=\"{delay}\"/></p:stCondLst><p:childTnLst><p:par><p:cTn id=\"{inner_id}\" fill=\"hold\"><p:stCondLst><p:cond delay=\"0\"/></p:stCondLst><p:childTnLst>{children}</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par>"));
    }
    let builds = active
        .iter()
        .filter(|(_, e)| matches!(e.kind, SceneKind::Text { .. }))
        .map(|(index, _)| format!("<p:bldP spid=\"{}\" grpId=\"0\"/>", index + 2))
        .collect::<String>();
    let builds = if builds.is_empty() {
        String::new()
    } else {
        format!("<p:bldLst>{builds}</p:bldLst>")
    };
    format!("<p:timing><p:tnLst><p:par><p:cTn id=\"1\" dur=\"indefinite\" restart=\"never\" nodeType=\"tmRoot\"><p:childTnLst><p:seq concurrent=\"1\" nextAc=\"seek\"><p:cTn id=\"2\" dur=\"indefinite\" nodeType=\"mainSeq\"><p:childTnLst>{groups}</p:childTnLst></p:cTn><p:prevCondLst><p:cond evt=\"onPrev\" delay=\"0\"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst><p:nextCondLst><p:cond evt=\"onNext\" delay=\"0\"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq></p:childTnLst></p:cTn></p:par></p:tnLst>{builds}</p:timing>")
}

fn shape_targets(
    root: XmlNode<'_, '_>,
    slide_id: &str,
    prefix: &str,
    elements: &[SceneElement],
    out: &mut BTreeMap<String, Vec<usize>>,
) {
    for (index, shape) in root.children().filter(|n| n.is_element()).enumerate() {
        if let Some(id) = descendant(shape, "cNvPr").and_then(|n| n.attribute("id")) {
            let base = format!("{slide_id}-{prefix}-{id}-{index}");
            let targets: Vec<_> = elements
                .iter()
                .enumerate()
                .filter(|(_, e)| e.id == base || e.id == format!("{base}-shape"))
                .map(|(i, _)| i)
                .collect();
            if !targets.is_empty() {
                out.insert(id.into(), targets);
            }
        }
        if shape.has_tag_name("grpSp") {
            shape_targets(
                shape,
                slide_id,
                &format!("{prefix}-g{index}"),
                elements,
                out,
            );
        }
    }
}
fn entry_animation(
    entry: XmlNode<'_, '_>,
    size: Size,
    rotation: f64,
) -> Option<Option<EntranceAnimation>> {
    let behaviors = descendant(entry, "childTnLst")?;
    let fade = child(behaviors, "animEffect");
    let Some(fade) = fade else {
        let setters: Vec<_> = behaviors.children().filter(|n| n.is_element()).collect();
        return (setters.len() == 1
            && setters[0].has_tag_name("set")
            && descendant(setters[0], "attrName").and_then(|n| n.text())
                == Some("style.visibility")
            && descendant(setters[0], "strVal").and_then(|n| n.attribute("val"))
                == Some("visible"))
        .then_some(None);
    };
    if fade.attribute("transition") != Some("in") || fade.attribute("filter") != Some("fade") {
        return None;
    }
    let common = descendant(fade, "cTn")?;
    let duration = common.attribute("dur")?.parse::<f64>().ok()?;
    let delay = child(entry, "stCondLst")
        .and_then(|n| child(n, "cond"))
        .and_then(|n| n.attribute("delay"))
        .unwrap_or("0")
        .parse::<f64>()
        .ok()?;
    let easing = match (
        common.attribute("accel").unwrap_or("0"),
        common.attribute("decel").unwrap_or("0"),
    ) {
        ("0", "0") => AnimationEasing::Linear,
        ("0", "80000") => AnimationEasing::EaseOut,
        ("50000", "50000") => AnimationEasing::EaseInOut,
        _ => return None,
    };
    let scale = child(behaviors, "animScale");
    let movements: Vec<_> = behaviors
        .children()
        .filter(|n| n.has_tag_name("anim"))
        .collect();
    let effect = if let Some(scale) = scale {
        if !movements.is_empty() {
            return None;
        }
        let from = child(scale, "from")?;
        let to = child(scale, "to")?;
        if from.attribute("x") != Some("95000")
            || from.attribute("y") != Some("95000")
            || to.attribute("x") != Some("100000")
            || to.attribute("y") != Some("100000")
        {
            return None;
        }
        EntranceEffect::Zoom
    } else if movements.is_empty() {
        EntranceEffect::Fade
    } else {
        let mut dx = 0.;
        let mut dy = 0.;
        for movement in movements {
            let axis = descendant(movement, "attrName")?.text()?;
            if !matches!(axis, "ppt_x" | "ppt_y") {
                return None;
            }
            let values: Vec<_> = movement
                .descendants()
                .filter(|n| n.has_tag_name("strVal"))
                .filter_map(|n| n.attribute("val"))
                .collect();
            if values.len() != 2 || values[1] != format!("#{axis}") {
                return None;
            }
            let offset = values[0]
                .strip_prefix(&format!("#{axis}"))?
                .parse::<f64>()
                .ok()?;
            if axis == "ppt_x" {
                dx = offset * size.width;
            } else {
                dy = offset * size.height;
            }
        }
        let radians = rotation.to_radians();
        let x = dx * radians.cos() + dy * radians.sin();
        let y = -dx * radians.sin() + dy * radians.cos();
        if x.abs() < 1e-5 && (y - 24.).abs() < 1e-5 {
            EntranceEffect::Rise
        } else if (x + 32.).abs() < 1e-5 && y.abs() < 1e-5 {
            EntranceEffect::Slide
        } else {
            return None;
        }
    };
    if behaviors.children().filter(|n| n.is_element()).any(|n| {
        !matches!(
            n.tag_name().name(),
            "set" | "animEffect" | "anim" | "animScale"
        )
    }) || !(0. ..=10000.).contains(&duration)
        || !(0. ..=60000.).contains(&delay)
    {
        return None;
    }
    Some(Some(EntranceAnimation {
        effect,
        duration_ms: duration,
        delay_ms: delay,
        easing,
    }))
}

/// Retain recognized native behavior, reporting incomplete translation through the return value.
pub(crate) fn read_slide_timing(
    root: XmlNode<'_, '_>,
    slide_id: &str,
    size: Size,
    elements: &mut [SceneElement],
) -> bool {
    let Some(timing) = child(root, "timing") else {
        return true;
    };
    let Some(main) = timing
        .descendants()
        .find(|n| n.has_tag_name("cTn") && n.attribute("nodeType") == Some("mainSeq"))
    else {
        return false;
    };
    let Some(groups) = child(main, "childTnLst") else {
        return false;
    };
    let mut targets = BTreeMap::new();
    if let Some(tree) = descendant(root, "spTree") {
        shape_targets(tree, slide_id, "content", elements, &mut targets);
    }
    let mut step = 0;
    let mut recognized = 0;
    let mut complete = true;
    let mut handled_behaviors = BTreeSet::new();
    let mut seen_targets = BTreeSet::new();
    for group in groups.children().filter(|n| n.is_element()) {
        let Some(common) = child(group, "cTn") else {
            complete = false;
            continue;
        };
        let delay = child(common, "stCondLst")
            .and_then(|n| child(n, "cond"))
            .and_then(|n| n.attribute("delay"));
        if delay == Some("indefinite") {
            step += 1;
        } else if delay != Some("0") {
            complete = false;
            continue;
        }
        if step > 10000 {
            return false;
        }
        for entry in common
            .descendants()
            .filter(|n| n.has_tag_name("cTn") && n.attribute("presetClass").is_some())
        {
            if entry.attribute("presetClass") != Some("entr") {
                complete = false;
                continue;
            }
            let ids: BTreeSet<_> = entry
                .descendants()
                .filter(|n| n.has_tag_name("spTgt"))
                .filter_map(|n| n.attribute("spid"))
                .collect();
            if ids.len() != 1 {
                complete = false;
                continue;
            }
            let Some(indices) = ids.first().and_then(|id| targets.get(*id)) else {
                complete = false;
                continue;
            };
            if !seen_targets.insert(*ids.first().expect("one target checked above")) {
                complete = false;
                continue;
            }
            let Some(animation) = entry_animation(entry, size, elements[indices[0]].frame.rotation)
            else {
                complete = false;
                continue;
            };
            for &index in indices {
                elements[index].step = Some(step);
                elements[index].animation = animation.clone();
            }
            handled_behaviors.extend(
                entry
                    .descendants()
                    .filter(|n| n.has_tag_name("cBhvr"))
                    .map(|n| n.id().get()),
            );
            recognized += 1;
        }
    }
    complete
        && recognized > 0
        && timing
            .descendants()
            .filter(|n| n.has_tag_name("cBhvr"))
            .all(|n| handled_behaviors.contains(&n.id().get()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{parse_pptx, write_pptx};

    fn animated_scene() -> SlideScene {
        SlideScene {
            version: 1,
            title: "Timing validation".into(),
            size: Size::default(),
            assets: vec![],
            slides: vec![SceneSlide {
                id: "s".into(),
                title: "Timing".into(),
                notes: String::new(),
                hidden: false,
                background: "#FFFFFF".into(),
                parent_id: None,
                elements: vec![SceneElement {
                    id: "shape".into(),
                    frame: Frame {
                        x: 80.,
                        y: 100.,
                        width: 200.,
                        height: 100.,
                        ..Frame::default()
                    },
                    style: TextStyle::default(),
                    step: Some(3),
                    animation: Some(EntranceAnimation {
                        effect: EntranceEffect::Fade,
                        duration_ms: 400.,
                        delay_ms: 50.,
                        easing: AnimationEasing::Linear,
                    }),
                    kind: SceneKind::Shape {
                        geometry: "rect".into(),
                        fill: Some("#5B5BD6".into()),
                        stroke: None,
                    },
                }],
            }],
        }
    }

    #[test]
    fn rejects_unsupported_native_timing_without_discarding_static_shapes() {
        let output = write_pptx(&animated_scene()).unwrap();
        let original = read_package(&output.bytes).unwrap();
        let xml = String::from_utf8(original["ppt/slides/slide1.xml"].clone()).unwrap();
        let variants = [
            xml.replace("filter=\"fade\"", "filter=\"wipe(up)\""),
            xml.replace("presetClass=\"entr\"", "presetClass=\"exit\""),
            xml.replace("spid=\"2\"", "spid=\"999\""),
            // A second, unrecognized timing branch must not silently disappear behind a supported entrance.
            xml.replace("</p:tnLst>", "<p:set><p:cBhvr><p:cTn id=\"999\" dur=\"1\"/><p:tgtEl><p:spTgt spid=\"2\"/></p:tgtEl></p:cBhvr><p:to><p:strVal val=\"hidden\"/></p:to></p:set></p:tnLst>"),
        ];
        for changed in variants {
            let mut parts = original.clone();
            parts.insert("ppt/slides/slide1.xml".into(), changed.into_bytes());
            let parsed = parse_pptx(&write_package(parts).unwrap()).unwrap();
            assert!(parsed
                .diagnostics
                .iter()
                .any(|d| d.code == "unsupportedAnimation"));
            assert_eq!(parsed.scene.slides[0].elements.len(), 1);
            assert_eq!(parsed.scene.slides[0].elements[0].frame.x, 80.);
        }
    }

    #[test]
    fn gapped_clicks_and_native_appear_builds_survive_import() {
        let mut scene = animated_scene();
        scene.slides[0].elements[0].animation = None;
        let output = write_pptx(&scene).unwrap();
        assert!(output
            .diagnostics
            .iter()
            .any(|d| d.code == "emptyAnimationStep"));
        let parsed = parse_pptx(&output.bytes).unwrap();
        assert_eq!(parsed.scene.slides[0].elements[0].step, Some(3));
        assert_eq!(parsed.scene.slides[0].elements[0].animation, None);
        assert!(!parsed
            .diagnostics
            .iter()
            .any(|d| d.code == "unsupportedAnimation"));
    }
}
