/**
 * TrainLog chart components
 *
 * Dependency-free SVG charts used by the body-weight and exercise-performance
 * screens. The functions return HTML strings and do not change app state.
 */

import { CHART_RANGES } from '../core/constants.js';
import { esc, fmtDateShort } from '../core/helpers.js';

/**
 * Format a chart value without an unnecessary trailing .0.
 */
function formatChartValue(value) {
  return value.toFixed(1).replace(/\.0$/, '');
}

/**
 * Render a responsive SVG line chart.
 *
 * Each point must contain:
 *   { date: 'YYYY-MM-DD', value: Number }
 */
export function renderLineChart(points = [], options = {}) {
  const validPoints = points.filter(
    (point) =>
      point &&
      point.date &&
      Number.isFinite(Number(point.value))
  );

  if (validPoints.length === 0) {
    return (
      '<div class="empty">' +
      esc(options.emptyText || 'No data yet.') +
      '</div>'
    );
  }

  const width = 100;
  const height = 46;
  const padding = 4;

  const values = validPoints.map((point) =>
    Number(point.value)
  );

  let minimum = Math.min(...values);
  let maximum = Math.max(...values);

  // Keep a single-value chart visible instead of drawing a flat line
  // directly against the edge of the SVG.
  if (minimum === maximum) {
    minimum -= 1;
    maximum += 1;
  }

  const stepX =
    validPoints.length > 1
      ? (width - 2 * padding) / (validPoints.length - 1)
      : 0;

  const coordinates = validPoints.map((point, index) => {
    const value = Number(point.value);
    const x = padding + index * stepX;
    const y =
      height -
      padding -
      ((value - minimum) / (maximum - minimum)) *
        (height - 2 * padding);

    return { x, y };
  });

  const linePath = coordinates
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'}` +
        `${point.x.toFixed(1)},${point.y.toFixed(1)}`
    )
    .join(' ');

  const firstPoint = coordinates[0];
  const lastPoint = coordinates[coordinates.length - 1];

  const areaPath =
    `${linePath} ` +
    `L${lastPoint.x.toFixed(1)},${height - padding} ` +
    `L${firstPoint.x.toFixed(1)},${height - padding} Z`;

  const color = options.color || '#FF5A2B';

  const dots = coordinates
    .map(
      (point) =>
        `<circle cx="${point.x.toFixed(1)}" ` +
        `cy="${point.y.toFixed(1)}" r="1.6" ` +
        `fill="${esc(color)}"/>`
    )
    .join('');

  const svg =
    `<svg viewBox="0 0 ${width} ${height}" ` +
    'preserveAspectRatio="none" ' +
    'style="width:100%; height:120px; display:block;" ' +
    'role="img" aria-label="Progress line chart">' +
      `<path d="${areaPath}" fill="${esc(color)}22" ` +
      'stroke="none"/>' +
      `<path d="${linePath}" fill="none" ` +
      `stroke="${esc(color)}" stroke-width="1.3" ` +
      'stroke-linejoin="round" stroke-linecap="round"/>' +
      dots +
    '</svg>';

  const unit = options.unit ? ` ${esc(options.unit)}` : '';

  const rangeLabels =
    '<div class="chart-range-lbl">' +
      `<span class="mono">${formatChartValue(maximum)}${unit}</span>` +
      '<span class="mono" style="color:var(--cinder-dim);">' +
        `${formatChartValue(minimum)}${unit}` +
      '</span>' +
    '</div>';

  const dateLabels =
    '<div class="chart-date-lbl">' +
      `<span>${esc(fmtDateShort(validPoints[0].date))}</span>` +
      `<span>${esc(
        fmtDateShort(validPoints[validPoints.length - 1].date)
      )}</span>` +
    '</div>';

  return (
    '<div class="chartwrap">' +
      rangeLabels +
      svg +
      dateLabels +
    '</div>'
  );
}

/**
 * Render the Weekly, Monthly, and 3 Months chart controls.
 */
export function rangeToggle(key, current = 'month') {
  const buttons = CHART_RANGES.map((range) => {
    const activeClass = current === range.id ? 'active' : '';

    return (
      `<button class="${activeClass}" type="button" ` +
      'data-action="set-range" ' +
      `data-range-key="${esc(key)}" ` +
      `data-range-val="${esc(range.id)}">` +
        esc(range.label) +
      '</button>'
    );
  }).join('');

  return (
    '<div class="subtabs" style="margin:10px 0 14px;">' +
      buttons +
    '</div>'
  );
}

/**
 * Convert a chart range ID into its number of days.
 */
export function rangeDays(range) {
  const match = CHART_RANGES.find(
    (chartRange) => chartRange.id === range
  );

  return match ? match.days : 30;
}
