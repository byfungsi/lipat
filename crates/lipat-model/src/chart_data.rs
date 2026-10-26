//! Editable category charts; the same data is used by previews and native PPTX charts.
use crate::{color_valid, resource_limit, LipatError, ResourceLimits, Result};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(JsonSchema, Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum ChartKind {
    Column,
    Bar,
    Line,
    Area,
    Pie,
    Doughnut,
}

#[derive(JsonSchema, Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ChartSeries {
    pub name: String,
    pub values: Vec<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
}

#[derive(JsonSchema, Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ChartData {
    pub kind: ChartKind,
    pub categories: Vec<String>,
    pub series: Vec<ChartSeries>,
    #[serde(default)]
    pub title: String,
    #[serde(default = "legend_default")]
    pub show_legend: bool,
    #[serde(default)]
    pub show_values: bool,
    #[serde(default)]
    pub stacked: bool,
    #[serde(default)]
    pub colors: Vec<String>,
}
fn legend_default() -> bool {
    true
}

/// Validate finite values, category alignment, supported combinations and host chart budgets.
pub fn check_chart(chart: &ChartData, limits: &ResourceLimits) -> Result<()> {
    let points = chart.categories.len().saturating_mul(chart.series.len());
    if points > limits.max_chart_points {
        return Err(resource_limit("maxChartPoints"));
    }
    if chart.title.len()
        + chart.categories.iter().map(String::len).sum::<usize>()
        + chart.series.iter().map(|s| s.name.len()).sum::<usize>()
        > limits.max_text_bytes
    {
        return Err(resource_limit("maxTextBytes"));
    }
    let circular = matches!(chart.kind, ChartKind::Pie | ChartKind::Doughnut);
    if chart.categories.is_empty()
        || chart.categories.len() > 1000
        || chart.series.is_empty()
        || chart.series.len() > 32
        || chart.colors.len() > 1000
        || chart.colors.iter().any(|c| !color_valid(c))
        || (circular && (chart.series.len() != 1 || chart.stacked))
        || (chart.stacked && matches!(chart.kind, ChartKind::Line))
        || chart.series.iter().any(|s| {
            s.values.len() != chart.categories.len()
                || s.color.as_ref().is_some_and(|c| !color_valid(c))
                || s.values
                    .iter()
                    .any(|v| !v.is_finite() || v.abs() > 1e12 || (circular && *v < 0.))
        })
        || (circular && chart.series[0].values.iter().sum::<f64>() <= 0.)
    {
        return Err(LipatError::new("invalidChart", "Chart data requires 1–1000 categories, 1–32 aligned finite series, valid colors and a supported chart combination; pie/doughnut require one nonnegative series with a positive total"));
    }
    Ok(())
}
