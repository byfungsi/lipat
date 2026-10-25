//! Atomic authoring operations shared by native and WebAssembly clients.
use lipat_model::*;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
#[derive(JsonSchema, Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum Operation {
    UpdateText {
        #[serde(rename = "nodeId")]
        node_id: String,
        text: TextContent,
    },
    UpdateStyle {
        #[serde(rename = "nodeId")]
        node_id: String,
        style: TextStyle,
    },
    SetFrame {
        #[serde(rename = "nodeId")]
        node_id: String,
        frame: Option<Frame>,
    },
    SetAnimation {
        #[serde(rename = "nodeId")]
        node_id: String,
        animation: Option<EntranceAnimation>,
    },
    SetStep {
        #[serde(rename = "nodeId")]
        node_id: String,
        step: Option<u32>,
    },
    SetLayout {
        #[serde(rename = "nodeId")]
        node_id: String,
        layout: Layout,
    },
    ReplaceNode {
        #[serde(rename = "nodeId")]
        node_id: String,
        node: Node,
    },
    InsertNode {
        #[serde(rename = "parentId")]
        parent_id: String,
        index: usize,
        node: Node,
    },
    DeleteNode {
        #[serde(rename = "nodeId")]
        node_id: String,
    },
    MoveNode {
        #[serde(rename = "nodeId")]
        node_id: String,
        #[serde(rename = "parentId")]
        parent_id: String,
        index: usize,
    },
    InsertSlide {
        index: usize,
        slide: Slide,
    },
    DeleteSlide {
        #[serde(rename = "slideId")]
        slide_id: String,
    },
    MoveSlide {
        #[serde(rename = "slideId")]
        slide_id: String,
        index: usize,
    },
    UpdateSlide {
        #[serde(rename = "slideId")]
        slide_id: String,
        #[serde(default)]
        title: Option<String>,
        #[serde(default)]
        notes: Option<String>,
        #[serde(default)]
        background: Option<String>,
        #[serde(default)]
        hidden: Option<bool>,
    },
    SetTheme {
        theme: Theme,
    },
    UpsertAsset {
        asset: Asset,
    },
    DeleteAsset {
        #[serde(rename = "assetId")]
        asset_id: String,
    },
}
#[derive(JsonSchema, Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum Layout {
    Stack { gap: f64 },
    Row { gap: f64 },
    Grid { columns: usize, gap: f64 },
    Canvas,
}
fn missing(id: &str) -> LipatError {
    let mut e = LipatError::new(
        "invalidOperation",
        format!("Authoring target does not exist: {id}"),
    );
    e.node_id = Some(id.into());
    e
}
fn find_node<'a>(node: &'a mut Node, id: &str) -> Option<&'a mut Node> {
    if node.id == id {
        return Some(node);
    }
    if let Some(children) = node.children_mut() {
        for c in children {
            if let Some(n) = find_node(c, id) {
                return Some(n);
            }
        }
    }
    None
}
fn find_doc_node<'a>(doc: &'a mut DeckDocument, id: &str) -> Result<&'a mut Node> {
    for slide in &mut doc.slides {
        if let Some(n) = find_node(&mut slide.content, id) {
            return Ok(n);
        }
    }
    Err(missing(id))
}
fn remove_node(node: &mut Node, id: &str) -> Option<Node> {
    if let Some(children) = node.children_mut() {
        if let Some(index) = children.iter().position(|c| c.id == id) {
            return Some(children.remove(index));
        }
        for c in children {
            if let Some(n) = remove_node(c, id) {
                return Some(n);
            }
        }
    }
    None
}
fn remove_doc_node(doc: &mut DeckDocument, id: &str) -> Result<Node> {
    for slide in &mut doc.slides {
        if let Some(n) = remove_node(&mut slide.content, id) {
            return Ok(n);
        }
    }
    Err(LipatError::new(
        "invalidOperation",
        format!("Cannot remove missing node or slide root: {id}"),
    ))
}
fn insert_node(doc: &mut DeckDocument, parent_id: &str, index: usize, node: Node) -> Result<()> {
    let parent = find_doc_node(doc, parent_id)?;
    let children = parent.children_mut().ok_or_else(|| {
        LipatError::new(
            "invalidOperation",
            "Insertion target must be a layout container",
        )
    })?;
    if index > children.len() {
        return Err(LipatError::new(
            "invalidOperation",
            "Node insertion index is out of bounds",
        ));
    }
    children.insert(index, node);
    Ok(())
}
/// Validate the final candidate only; a failed batch never mutates the supplied document.
pub fn apply_operations(doc: &DeckDocument, operations: &[Operation]) -> Result<DeckDocument> {
    check_document(doc)?;
    if operations.len() > 10000 {
        return Err(LipatError::new(
            "resourceLimit",
            "Batch exceeds 10000 operations",
        ));
    }
    let mut next = doc.clone();
    for operation in operations {
        match operation {
            Operation::UpdateText { node_id, text } => {
                let n = find_doc_node(&mut next, node_id)?;
                match &mut n.kind {
                    NodeKind::Heading { text: t, .. } | NodeKind::Text { text: t } => {
                        *t = text.clone()
                    }
                    NodeKind::Code { text: t, .. } => *t = text.text(),
                    _ => {
                        return Err(LipatError::new(
                            "invalidOperation",
                            "Text edits require a heading, text or code node",
                        ))
                    }
                }
            }
            Operation::UpdateStyle { node_id, style } => {
                let old = &mut find_doc_node(&mut next, node_id)?.style;
                merge_style(old, style);
            }
            Operation::SetFrame { node_id, frame } => {
                find_doc_node(&mut next, node_id)?.frame = *frame
            }
            Operation::SetAnimation { node_id, animation } => {
                find_doc_node(&mut next, node_id)?.animation = animation.clone();
            }
            Operation::SetStep { node_id, step } => {
                find_doc_node(&mut next, node_id)?.step = *step;
            }
            Operation::SetLayout { node_id, layout } => {
                let n = find_doc_node(&mut next, node_id)?;
                let children = n
                    .children()
                    .ok_or_else(|| {
                        LipatError::new("invalidOperation", "Layout edits require a container")
                    })?
                    .to_vec();
                n.kind = match layout {
                    Layout::Stack { gap } => NodeKind::Stack {
                        children,
                        gap: Some(*gap),
                    },
                    Layout::Row { gap } => NodeKind::Row {
                        children,
                        gap: Some(*gap),
                    },
                    Layout::Grid { columns, gap } => NodeKind::Grid {
                        columns: *columns,
                        children,
                        gap: Some(*gap),
                    },
                    Layout::Canvas => NodeKind::Canvas { children },
                };
            }
            Operation::ReplaceNode { node_id, node } => {
                if &node.id != node_id {
                    return Err(LipatError::new(
                        "invalidOperation",
                        "Replacement must preserve its target identity",
                    ));
                }
                *find_doc_node(&mut next, node_id)? = node.clone();
            }
            Operation::InsertNode {
                parent_id,
                index,
                node,
            } => insert_node(&mut next, parent_id, *index, node.clone())?,
            Operation::DeleteNode { node_id } => {
                remove_doc_node(&mut next, node_id)?;
            }
            Operation::MoveNode {
                node_id,
                parent_id,
                index,
            } => {
                let node = remove_doc_node(&mut next, node_id)?;
                insert_node(&mut next, parent_id, *index, node)?;
            }
            Operation::InsertSlide { index, slide } => {
                if *index > next.slides.len() {
                    return Err(LipatError::new(
                        "invalidOperation",
                        "Slide insertion index is out of bounds",
                    ));
                }
                next.slides.insert(*index, slide.clone());
            }
            Operation::DeleteSlide { slide_id } => {
                let index = next
                    .slides
                    .iter()
                    .position(|s| &s.id == slide_id)
                    .ok_or_else(|| missing(slide_id))?;
                next.slides.remove(index);
            }
            Operation::MoveSlide { slide_id, index } => {
                if *index >= next.slides.len() {
                    return Err(LipatError::new(
                        "invalidOperation",
                        "Slide move index is out of bounds",
                    ));
                }
                let old = next
                    .slides
                    .iter()
                    .position(|s| &s.id == slide_id)
                    .ok_or_else(|| missing(slide_id))?;
                let s = next.slides.remove(old);
                next.slides.insert(*index, s);
            }
            Operation::UpdateSlide {
                slide_id,
                title,
                notes,
                background,
                hidden,
            } => {
                let s = next
                    .slides
                    .iter_mut()
                    .find(|s| &s.id == slide_id)
                    .ok_or_else(|| missing(slide_id))?;
                if let Some(v) = title {
                    s.title = v.clone();
                }
                if let Some(v) = notes {
                    s.notes = v.clone();
                }
                if let Some(v) = background {
                    s.background = Some(v.clone());
                }
                if let Some(v) = hidden {
                    s.hidden = *v;
                }
            }
            Operation::SetTheme { theme } => next.theme = theme.clone(),
            Operation::UpsertAsset { asset } => {
                if let Some(a) = next.assets.iter_mut().find(|a| a.id == asset.id) {
                    *a = asset.clone();
                } else {
                    next.assets.push(asset.clone());
                }
            }
            Operation::DeleteAsset { asset_id } => {
                if !next.assets.iter().any(|a| &a.id == asset_id) {
                    return Err(missing(asset_id));
                }
                next.assets.retain(|a| &a.id != asset_id);
            }
        }
    }
    check_document(&next)?;
    Ok(next)
}
fn merge_style(old: &mut TextStyle, new: &TextStyle) {
    if new.font_family.is_some() {
        old.font_family = new.font_family.clone();
    }
    if new.font_size.is_some() {
        old.font_size = new.font_size;
    }
    if new.color.is_some() {
        old.color = new.color.clone();
    }
    if new.bold.is_some() {
        old.bold = new.bold;
    }
    if new.italic.is_some() {
        old.italic = new.italic;
    }
    if new.underline.is_some() {
        old.underline = new.underline;
    }
    if new.align.is_some() {
        old.align = new.align.clone();
    }
}
