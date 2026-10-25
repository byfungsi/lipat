use lipat_model::{LipatError, Result};
use std::{
    collections::BTreeMap,
    io::{Cursor, Read, Write},
};
use zip::{write::SimpleFileOptions, CompressionMethod, ZipArchive, ZipWriter};
pub(crate) type Parts = BTreeMap<String, Vec<u8>>;
pub(crate) fn read_package(bytes: &[u8]) -> Result<Parts> {
    if bytes.len() > 32 * 1024 * 1024 {
        return Err(LipatError::new(
            "resourceLimit",
            "PPTX input exceeds 32 MiB",
        ));
    }
    let mut zip = ZipArchive::new(Cursor::new(bytes))
        .map_err(|_| LipatError::new("invalidPptx", "PPTX must be an unencrypted ZIP archive"))?;
    if zip.len() > 10000 {
        return Err(LipatError::new(
            "resourceLimit",
            "PPTX contains more than 10000 entries",
        ));
    }
    let mut parts = Parts::new();
    let mut total = 0u64;
    for i in 0..zip.len() {
        let mut file = zip
            .by_index(i)
            .map_err(|_| LipatError::new("invalidPptx", "Cannot read ZIP entry"))?;
        if file.is_dir() {
            continue;
        }
        let path = file.name().to_string();
        if path.starts_with('/')
            || path.contains('\\')
            || path.split('/').any(|s| s == ".." || s == ".")
            || parts.contains_key(&path)
        {
            return Err(LipatError::new(
                "invalidPptx",
                "Unsafe or duplicate ZIP part path",
            ));
        }
        total = total
            .checked_add(file.size())
            .ok_or_else(|| LipatError::new("resourceLimit", "ZIP size overflow"))?;
        if total > 64 * 1024 * 1024 || file.size() > 32 * 1024 * 1024 {
            return Err(LipatError::new(
                "resourceLimit",
                "PPTX expanded parts exceed resource limits",
            ));
        }
        let mut content = vec![];
        file.by_ref()
            .take(32 * 1024 * 1024 + 1)
            .read_to_end(&mut content)
            .map_err(|_| LipatError::new("invalidPptx", "Corrupt or unsupported ZIP entry"))?;
        if content.len() > 32 * 1024 * 1024 {
            return Err(LipatError::new(
                "resourceLimit",
                "Expanded ZIP entry exceeds 32 MiB",
            ));
        }
        parts.insert(path, content);
    }
    Ok(parts)
}
pub(crate) fn write_package(parts: Parts) -> Result<Vec<u8>> {
    let mut zip = ZipWriter::new(Cursor::new(Vec::new()));
    for (path, bytes) in parts {
        zip.start_file(
            path,
            SimpleFileOptions::default().compression_method(CompressionMethod::Deflated),
        )
        .map_err(|_| LipatError::new("exportFailed", "Cannot create ZIP part"))?;
        zip.write_all(&bytes)
            .map_err(|_| LipatError::new("exportFailed", "Cannot write ZIP part"))?;
    }
    zip.finish()
        .map(|c| c.into_inner())
        .map_err(|_| LipatError::new("exportFailed", "Cannot finish PPTX ZIP"))
}
pub(crate) fn xml_text<'a>(parts: &'a Parts, path: &str) -> Result<&'a str> {
    let bytes = parts
        .get(path)
        .ok_or_else(|| LipatError::new("invalidPptx", format!("Missing package part: {path}")))?;
    if bytes.len() > 8 * 1024 * 1024 {
        return Err(LipatError::new("resourceLimit", "XML part exceeds 8 MiB"));
    }
    std::str::from_utf8(bytes)
        .map_err(|_| LipatError::new("invalidPptx", "Expected UTF-8 XML part"))
}
pub(crate) fn parse_xml(text: &str) -> Result<roxmltree::Document<'_>> {
    roxmltree::Document::parse_with_options(
        text,
        roxmltree::ParsingOptions {
            allow_dtd: false,
            nodes_limit: 200000,
        },
    )
    .map_err(|_| LipatError::new("invalidPptx", "Malformed or over-budget XML part"))
}
pub(crate) fn rels_path(path: &str) -> String {
    let (dir, name) = path.rsplit_once('/').unwrap_or(("", path));
    if dir.is_empty() {
        format!("_rels/{name}.rels")
    } else {
        format!("{dir}/_rels/{name}.rels")
    }
}
pub(crate) fn resolve_path(source: &str, target: &str) -> Result<String> {
    let mut segments: Vec<&str> = if target.starts_with('/') {
        vec![]
    } else {
        source
            .rsplit_once('/')
            .map(|(d, _)| d.split('/').collect())
            .unwrap_or_default()
    };
    for s in target.trim_start_matches('/').split('/') {
        match s {
            "" | "." => {}
            ".." => {
                if segments.pop().is_none() {
                    return Err(LipatError::new(
                        "invalidPptx",
                        "Relationship escapes package root",
                    ));
                }
            }
            _ => segments.push(s),
        }
    }
    if target.contains('\\') || target.contains(':') || target.contains('%') {
        return Err(LipatError::new(
            "invalidPptx",
            "Unsupported relationship target path",
        ));
    }
    Ok(segments.join("/"))
}
#[derive(Clone)]
pub(crate) struct Relationship {
    pub kind: String,
    pub target: String,
    pub external: bool,
}
pub(crate) fn relationships(parts: &Parts, path: &str) -> Result<BTreeMap<String, Relationship>> {
    let rel_path = if path.is_empty() {
        "_rels/.rels".into()
    } else {
        rels_path(path)
    };
    if !parts.contains_key(&rel_path) {
        return Ok(BTreeMap::new());
    }
    let doc = parse_xml(xml_text(parts, &rel_path)?)?;
    let mut out = BTreeMap::new();
    for n in doc
        .root_element()
        .children()
        .filter(|n| n.has_tag_name("Relationship"))
    {
        let id = n.attribute("Id").unwrap_or("");
        let external = n.attribute("TargetMode") == Some("External");
        let target = n.attribute("Target").unwrap_or("");
        if id.is_empty() || out.contains_key(id) {
            return Err(LipatError::new(
                "invalidPptx",
                "Missing or duplicate relationship identity",
            ));
        }
        out.insert(
            id.into(),
            Relationship {
                kind: n.attribute("Type").unwrap_or("").into(),
                target: if external {
                    target.into()
                } else {
                    resolve_path(path, target)?
                },
                external,
            },
        );
    }
    Ok(out)
}
pub(crate) fn child<'a, 'b>(
    n: roxmltree::Node<'a, 'b>,
    name: &str,
) -> Option<roxmltree::Node<'a, 'b>> {
    n.children()
        .find(|n| n.is_element() && n.tag_name().name() == name)
}
pub(crate) fn descendant<'a, 'b>(
    n: roxmltree::Node<'a, 'b>,
    name: &str,
) -> Option<roxmltree::Node<'a, 'b>> {
    n.descendants()
        .find(|n| n.is_element() && n.tag_name().name() == name)
}
pub(crate) fn rel_attr<'a, 'b>(n: roxmltree::Node<'a, 'b>, name: &str) -> Option<&'a str> {
    n.attributes()
        .find(|a| a.name() == name && a.namespace().is_some())
        .map(|a| a.value())
}
pub(crate) fn escape_xml(s: &str) -> String {
    s.chars()
        .filter(|c| matches!(*c, '\t' | '\r' | '\n') || *c >= ' ')
        .map(|c| match c {
            '&' => "&amp;".into(),
            '<' => "&lt;".into(),
            '>' => "&gt;".into(),
            '"' => "&quot;".into(),
            '\'' => "&apos;".into(),
            _ => c.to_string(),
        })
        .collect()
}
