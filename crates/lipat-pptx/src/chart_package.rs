//! Native DrawingML category charts with an embedded, editable XLSX data source.
use crate::package::*;
use lipat_model::*;
use roxmltree::Node;

const C: &str = "http://schemas.openxmlformats.org/drawingml/2006/chart";
const A: &str = "http://schemas.openxmlformats.org/drawingml/2006/main";
const R: &str = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const PALETTE: [&str; 6] = [
    "#5856D6", "#16A085", "#F2A541", "#E56476", "#3887BE", "#8B6BB1",
];
fn paint(value: &str) -> String {
    format!(
        "<a:solidFill><a:srgbClr val=\"{}\"/></a:solidFill>",
        &value[1..]
    )
}
fn series_color(chart: &ChartData, i: usize) -> &str {
    chart
        .series
        .get(i)
        .and_then(|s| s.color.as_deref())
        .or_else(|| {
            chart
                .colors
                .get(i % chart.colors.len().max(1))
                .map(String::as_str)
        })
        .unwrap_or(PALETTE[i % PALETTE.len()])
}
fn column_name(mut i: usize) -> String {
    let mut out = String::new();
    loop {
        out.insert(0, (b'A' + (i % 26) as u8) as char);
        if i < 26 {
            break;
        }
        i = i / 26 - 1;
    }
    out
}
fn string_cache(values: &[String]) -> String {
    format!(
        "<c:ptCount val=\"{}\"/>{}",
        values.len(),
        values
            .iter()
            .enumerate()
            .map(|(i, v)| format!("<c:pt idx=\"{i}\"><c:v>{}</c:v></c:pt>", escape_xml(v)))
            .collect::<String>()
    )
}
fn chart_series(chart: &ChartData, i: usize) -> String {
    let s = &chart.series[i];
    let col = column_name(i + 1);
    let count = chart.categories.len();
    let circular = matches!(chart.kind, ChartKind::Pie | ChartKind::Doughnut);
    let line = chart.kind == ChartKind::Line;
    let fill = paint(series_color(chart, i));
    let shape = if line {
        format!("<a:ln w=\"25400\">{fill}</a:ln>")
    } else {
        fill.clone()
    };
    let points = if circular {
        chart
            .categories
            .iter()
            .enumerate()
            .map(|(j, _)| {
                format!(
                    "<c:dPt><c:idx val=\"{j}\"/><c:spPr>{}</c:spPr></c:dPt>",
                    paint(
                        chart
                            .colors
                            .get(j % chart.colors.len().max(1))
                            .map(String::as_str)
                            .unwrap_or(PALETTE[j % PALETTE.len()])
                    )
                )
            })
            .collect::<String>()
    } else {
        String::new()
    };
    let markers = if line {
        format!("<c:marker><c:symbol val=\"circle\"/><c:size val=\"5\"/><c:spPr>{fill}<a:ln>{fill}</a:ln></c:spPr></c:marker>")
    } else {
        String::new()
    };
    format!("<c:ser><c:idx val=\"{i}\"/><c:order val=\"{i}\"/><c:tx><c:strRef><c:f>Sheet1!${col}$1</c:f><c:strCache>{}</c:strCache></c:strRef></c:tx><c:spPr>{shape}</c:spPr>{markers}{points}<c:cat><c:strRef><c:f>Sheet1!$A$2:$A${}</c:f><c:strCache>{}</c:strCache></c:strRef></c:cat><c:val><c:numRef><c:f>Sheet1!${col}$2:${col}${}</c:f><c:numCache><c:formatCode>General</c:formatCode><c:ptCount val=\"{count}\"/>{}</c:numCache></c:numRef></c:val></c:ser>", string_cache(std::slice::from_ref(&s.name)), count+1, string_cache(&chart.categories), count+1, s.values.iter().enumerate().map(|(j,v)|format!("<c:pt idx=\"{j}\"><c:v>{v}</c:v></c:pt>")).collect::<String>())
}

/// Write one native chart part and its own embedded workbook; all paths are package-relative.
pub(crate) fn write_chart(
    parts: &mut Parts,
    stem: &str,
    chart: &ChartData,
    style: &TextStyle,
) -> Result<String> {
    let chart_path = format!("ppt/charts/{stem}.xml");
    let workbook_path = format!("ppt/embeddings/{stem}.xlsx");
    parts.insert(workbook_path, write_workbook(chart)?);
    parts.insert(
        rels_path(&chart_path),
        rels(&[(
            "rIdWorkbook".into(),
            "package".into(),
            format!("../embeddings/{stem}.xlsx"),
        )])
        .into_bytes(),
    );
    let title = if chart.title.is_empty() {
        "<c:autoTitleDeleted val=\"1\"/>".into()
    } else {
        format!("<c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang=\"en-US\"/><a:t>{}</a:t></a:r></a:p></c:rich></c:tx><c:overlay val=\"0\"/></c:title><c:autoTitleDeleted val=\"0\"/>", escape_xml(&chart.title))
    };
    let circular = matches!(chart.kind, ChartKind::Pie | ChartKind::Doughnut);
    let grouping = if chart.stacked {
        "stacked"
    } else if matches!(chart.kind, ChartKind::Bar | ChartKind::Column) {
        "clustered"
    } else {
        "standard"
    };
    let tag = match chart.kind {
        ChartKind::Bar | ChartKind::Column => "barChart",
        ChartKind::Line => "lineChart",
        ChartKind::Area => "areaChart",
        ChartKind::Pie => "pieChart",
        ChartKind::Doughnut => "doughnutChart",
    };
    let head = if matches!(chart.kind, ChartKind::Bar | ChartKind::Column) {
        format!(
            "<c:barDir val=\"{}\"/><c:grouping val=\"{grouping}\"/>",
            if chart.kind == ChartKind::Bar {
                "bar"
            } else {
                "col"
            }
        )
    } else if circular {
        String::new()
    } else {
        format!("<c:grouping val=\"{grouping}\"/>")
    };
    let labels = format!("<c:dLbls><c:showLegendKey val=\"0\"/><c:showVal val=\"{}\"/><c:showCatName val=\"0\"/><c:showSerName val=\"0\"/><c:showPercent val=\"{}\"/></c:dLbls>", u8::from(chart.show_values && !circular), u8::from(chart.show_values && circular));
    let tail = match chart.kind {
        ChartKind::Bar | ChartKind::Column => format!(
            "<c:gapWidth val=\"80\"/><c:overlap val=\"{}\"/>",
            if chart.stacked { 100 } else { 0 }
        ),
        ChartKind::Pie => "<c:firstSliceAng val=\"270\"/>".into(),
        ChartKind::Doughnut => "<c:firstSliceAng val=\"270\"/><c:holeSize val=\"58\"/>".into(),
        _ => String::new(),
    };
    let ids = if circular {
        ""
    } else {
        "<c:axId val=\"1\"/><c:axId val=\"2\"/>"
    };
    let axes = if circular {
        String::new()
    } else {
        let (cat_pos, val_pos) = if chart.kind == ChartKind::Bar {
            ("l", "b")
        } else {
            ("b", "l")
        };
        format!("<c:catAx><c:axId val=\"1\"/><c:scaling><c:orientation val=\"minMax\"/></c:scaling><c:delete val=\"0\"/><c:axPos val=\"{cat_pos}\"/><c:majorTickMark val=\"none\"/><c:minorTickMark val=\"none\"/><c:tickLblPos val=\"nextTo\"/><c:crossAx val=\"2\"/><c:crosses val=\"autoZero\"/><c:auto val=\"1\"/><c:lblAlgn val=\"ctr\"/><c:lblOffset val=\"100\"/></c:catAx><c:valAx><c:axId val=\"2\"/><c:scaling><c:orientation val=\"minMax\"/></c:scaling><c:delete val=\"0\"/><c:axPos val=\"{val_pos}\"/><c:majorGridlines/><c:numFmt formatCode=\"General\" sourceLinked=\"1\"/><c:majorTickMark val=\"none\"/><c:minorTickMark val=\"none\"/><c:tickLblPos val=\"nextTo\"/><c:crossAx val=\"1\"/><c:crosses val=\"autoZero\"/><c:crossBetween val=\"between\"/></c:valAx>")
    };
    let legend = if chart.show_legend {
        "<c:legend><c:legendPos val=\"b\"/><c:layout/><c:overlay val=\"0\"/></c:legend>"
    } else {
        ""
    };
    let fg = style.color.as_deref().unwrap_or("#172033");
    let family = escape_xml(style.font_family.as_deref().unwrap_or("Arial"));
    let xml = format!("<c:chartSpace xmlns:c=\"{C}\" xmlns:a=\"{A}\" xmlns:r=\"{R}\"><c:lang val=\"en-US\"/><c:chart>{title}<c:plotArea><c:layout/><c:{tag}>{head}<c:varyColors val=\"{}\"/>{}{labels}{tail}{ids}</c:{tag}>{axes}</c:plotArea>{legend}<c:plotVisOnly val=\"1\"/><c:dispBlanksAs val=\"gap\"/></c:chart><c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr><c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz=\"1200\">{}<a:latin typeface=\"{family}\"/></a:defRPr></a:pPr><a:endParaRPr lang=\"en-US\"/></a:p></c:txPr><c:externalData r:id=\"rIdWorkbook\"><c:autoUpdate val=\"0\"/></c:externalData></c:chartSpace>", u8::from(circular), (0..chart.series.len()).map(|i|chart_series(chart,i)).collect::<String>(), paint(fg));
    parts.insert(chart_path.clone(), xml.into_bytes());
    Ok(chart_path)
}

fn write_workbook(chart: &ChartData) -> Result<Vec<u8>> {
    let mut parts = Parts::new();
    parts.insert("[Content_Types].xml".into(), br#"<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>"#.to_vec());
    parts.insert(
        "_rels/.rels".into(),
        rels(&[(
            "rIdWorkbook".into(),
            "officeDocument".into(),
            "xl/workbook.xml".into(),
        )])
        .into_bytes(),
    );
    parts.insert("xl/workbook.xml".into(), format!("<workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"{R}\"><sheets><sheet name=\"Sheet1\" sheetId=\"1\" r:id=\"rIdSheet\"/></sheets></workbook>").into_bytes());
    parts.insert(
        "xl/_rels/workbook.xml.rels".into(),
        rels(&[(
            "rIdSheet".into(),
            "worksheet".into(),
            "worksheets/sheet1.xml".into(),
        )])
        .into_bytes(),
    );
    let cell = |col: usize, row: usize, value: &str| {
        format!(
            "<c r=\"{}{row}\" t=\"inlineStr\"><is><t xml:space=\"preserve\">{}</t></is></c>",
            column_name(col),
            escape_xml(value)
        )
    };
    let mut rows = format!(
        "<row r=\"1\">{}{}</row>",
        cell(0, 1, "Category"),
        chart
            .series
            .iter()
            .enumerate()
            .map(|(i, s)| cell(i + 1, 1, &s.name))
            .collect::<String>()
    );
    for (i, cat) in chart.categories.iter().enumerate() {
        rows.push_str(&format!(
            "<row r=\"{}\">{}{}</row>",
            i + 2,
            cell(0, i + 2, cat),
            chart
                .series
                .iter()
                .enumerate()
                .map(|(j, s)| format!(
                    "<c r=\"{}{}\"><v>{}</v></c>",
                    column_name(j + 1),
                    i + 2,
                    s.values[i]
                ))
                .collect::<String>()
        ));
    }
    parts.insert("xl/worksheets/sheet1.xml".into(),format!("<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><dimension ref=\"A1:{}{}\"/><sheetData>{rows}</sheetData></worksheet>",column_name(chart.series.len()),chart.categories.len()+1).into_bytes());
    write_package(parts)
}

fn cached_values(node: Node<'_, '_>, count_limit: usize) -> Result<Option<Vec<String>>> {
    let Some(cache) = node.descendants().find(|n| {
        matches!(
            n.tag_name().name(),
            "strCache" | "numCache" | "strLit" | "numLit"
        )
    }) else {
        return Ok(None);
    };
    let count = child(cache, "ptCount")
        .and_then(|n| n.attribute("val"))
        .and_then(|s| s.parse::<usize>().ok())
        .ok_or_else(|| {
            LipatError::new("invalidPptx", "Chart cache requires a finite point count")
        })?;
    if count > count_limit || count > 1000 {
        return Err(resource_limit("maxChartPoints"));
    }
    let mut values = vec![String::new(); count];
    let mut seen = std::collections::HashSet::new();
    for pt in cache.children().filter(|n| n.has_tag_name((C, "pt"))) {
        let index = pt
            .attribute("idx")
            .and_then(|v| v.parse::<usize>().ok())
            .filter(|i| *i < count)
            .ok_or_else(|| {
                LipatError::new(
                    "invalidPptx",
                    "Chart cache point index is outside its declared count",
                )
            })?;
        if !seen.insert(index) {
            return Err(LipatError::new(
                "invalidPptx",
                "Chart cache contains duplicate point indices",
            ));
        }
        values[index] = child(pt, "v").and_then(|n| n.text()).unwrap_or("").into();
    }
    if seen.len() != count {
        return Ok(None);
    }
    Ok(Some(values))
}
fn xml_color(node: Node<'_, '_>) -> Option<String> {
    descendant(node, "srgbClr")
        .and_then(|n| n.attribute("val"))
        .filter(|v| v.len() == 6 && v.bytes().all(|b| b.is_ascii_hexdigit()))
        .map(|v| format!("#{v}"))
}

/// Read supported 2D category charts from cached values; never evaluate formulas or fetch linked workbooks.
pub(crate) fn read_chart(
    parts: &Parts,
    path: &str,
    remaining_points: usize,
) -> Result<Option<(ChartData, TextStyle)>> {
    let xml = parse_xml(xml_text(parts, path)?, &parts.limits)?;
    let Some(plot) = descendant(xml.root_element(), "plotArea") else {
        return Ok(None);
    };
    let charts: Vec<_> = plot
        .children()
        .filter(|n| n.is_element() && n.tag_name().name().ends_with("Chart"))
        .collect();
    if charts.len() != 1 || descendant(plot, "logBase").is_some() {
        return Ok(None);
    }
    let group = charts[0];
    let kind = match group.tag_name().name() {
        "barChart" => {
            if child(group, "barDir").and_then(|n| n.attribute("val")) == Some("bar") {
                ChartKind::Bar
            } else {
                ChartKind::Column
            }
        }
        "lineChart" => ChartKind::Line,
        "areaChart" => ChartKind::Area,
        "pieChart" => ChartKind::Pie,
        "doughnutChart" => ChartKind::Doughnut,
        _ => return Ok(None),
    };
    let grouping = child(group, "grouping")
        .and_then(|n| n.attribute("val"))
        .unwrap_or("standard");
    if grouping == "percentStacked" || (grouping == "stacked" && kind == ChartKind::Line) {
        return Ok(None);
    }
    let series_nodes: Vec<_> = group
        .children()
        .filter(|n| n.has_tag_name((C, "ser")))
        .collect();
    if series_nodes.is_empty() || series_nodes.len() > 32 {
        return Ok(None);
    }
    let mut categories = Vec::new();
    let mut series = Vec::new();
    let mut colors = Vec::new();
    for (i, node) in series_nodes.iter().enumerate() {
        let Some(cat) = child(*node, "cat") else {
            return Ok(None);
        };
        let Some(cats) = cached_values(cat, remaining_points / series_nodes.len())? else {
            return Ok(None);
        };
        if i == 0 {
            categories = cats;
        } else if categories != cats {
            return Ok(None);
        }
        let Some(val) = child(*node, "val") else {
            return Ok(None);
        };
        let Some(values) = cached_values(val, remaining_points / series_nodes.len())? else {
            return Ok(None);
        };
        let values = values
            .into_iter()
            .map(|s| {
                s.parse::<f64>().map_err(|_| {
                    LipatError::new("invalidPptx", "Chart cache contains a nonnumeric value")
                })
            })
            .collect::<Result<Vec<_>>>()?;
        let name = if let Some(tx) = child(*node, "tx") {
            cached_values(tx, 1)?
                .and_then(|v| v.into_iter().next())
                .or_else(|| child(tx, "v").and_then(|n| n.text()).map(String::from))
                .unwrap_or_else(|| format!("Series {}", i + 1))
        } else {
            format!("Series {}", i + 1)
        };
        series.push(ChartSeries {
            name,
            values,
            color: child(*node, "spPr").and_then(xml_color),
        });
        if i == 0 && matches!(kind, ChartKind::Pie | ChartKind::Doughnut) {
            colors = (0..categories.len())
                .map(|j| {
                    node.children()
                        .find(|n| {
                            n.has_tag_name((C, "dPt"))
                                && child(*n, "idx")
                                    .and_then(|n| n.attribute("val"))
                                    .and_then(|v| v.parse::<usize>().ok())
                                    == Some(j)
                        })
                        .and_then(xml_color)
                        .unwrap_or_else(|| PALETTE[j % PALETTE.len()].into())
                })
                .collect();
        }
    }
    let title = descendant(xml.root_element(), "chart")
        .and_then(|n| child(n, "title"))
        .map(|n| {
            n.descendants()
                .filter(|n| n.has_tag_name((A, "t")))
                .filter_map(|n| n.text())
                .collect::<String>()
        })
        .unwrap_or_default();
    let labels = child(group, "dLbls");
    let chart = ChartData {
        kind,
        categories,
        series,
        title,
        colors,
        stacked: grouping == "stacked",
        show_legend: descendant(xml.root_element(), "legend").is_some(),
        show_values: labels.is_some_and(|n| {
            ["showVal", "showPercent"].iter().any(|tag| {
                child(n, tag)
                    .and_then(|n| n.attribute("val"))
                    .is_some_and(|v| v == "1" || v == "true")
            })
        }),
    };
    check_chart(
        &chart,
        &ResourceLimits {
            max_chart_points: remaining_points,
            ..parts.limits
        },
    )?;
    let tx = child(xml.root_element(), "txPr");
    let style = TextStyle {
        color: tx.and_then(xml_color),
        font_family: tx
            .and_then(|n| descendant(n, "latin"))
            .and_then(|n| n.attribute("typeface"))
            .map(String::from),
        ..TextStyle::default()
    };
    Ok(Some((chart, style)))
}
