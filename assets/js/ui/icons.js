/**
 * TrainLog SVG icons
 *
 * These icons are returned as HTML strings so they can be inserted into
 * navigation buttons, workout cards, action buttons, and modal controls.
 * The SVG paths are preserved from the original single-file TrainLog app.
 */

/**
 * Return one TrainLog icon as an SVG string.
 *
 * @param {string} name - Icon name, such as "home" or "dumbbell".
 * @param {number} [size=20] - Width and height in pixels.
 * @param {string} [color="currentColor"] - SVG stroke colour.
 * @returns {string} SVG markup, or an empty string for an unknown icon.
 */
export function icon(name, size = 20, color = 'currentColor') {
  const svgAttributes = [
    `width="${size}"`,
    `height="${size}"`,
    'viewBox="0 0 24 24"',
    'fill="none"',
    `stroke="${color}"`,
    'stroke-width="1.8"',
    'stroke-linecap="round"',
    'stroke-linejoin="round"',
    'aria-hidden="true"',
    'focusable="false"',
  ].join(' ');

  switch (name) {
    case 'home':
      return `<svg ${svgAttributes}><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-9"/><path d="M9.5 20v-6h5v6"/></svg>`;

    case 'calendar':
      return `<svg ${svgAttributes}><rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/></svg>`;

    case 'trophy':
      return `<svg ${svgAttributes}><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 5H4a3 3 0 0 0 3 4M17 5h3a3 3 0 0 1-3 4"/><path d="M12 14v3M9 20.5h6M9.5 20.5c0-2 .8-2.7 2.5-3.5 1.7.8 2.5 1.5 2.5 3.5"/></svg>`;

    case 'user':
      return `<svg ${svgAttributes}><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c1.4-3.8 4.2-5.6 7.5-5.6s6.1 1.8 7.5 5.6"/></svg>`;

    case 'flame':
      return `<svg ${svgAttributes}><path d="M12 3s-1 3.2-3.2 5.4C6.8 10.4 6 12 6 14a6 6 0 0 0 12 0c0-2.6-1.4-4-2.4-5.3.1 1.6-.6 2.6-1.4 2.9C14.8 8.6 14 5.8 12 3Z"/></svg>`;

    case 'dumbbell':
      return `<svg ${svgAttributes}><path d="M4 9v6M2.5 10.5v3M7 7v10"/><path d="M20 9v6M21.5 10.5v3M17 7v10"/><path d="M7 12h10"/></svg>`;

    case 'bolt':
      return `<svg ${svgAttributes}><path d="M13 3 5 13.5h5.5L10.5 21l8-11h-5.5L13 3Z"/></svg>`;

    case 'run':
      return `<svg ${svgAttributes}><circle cx="15.2" cy="4.8" r="1.9"/><path d="M12.5 21 14 15l-3-2 .8-4.4L15 10l1.2 3.4 4 1.1M8 12l3-1.5"/><path d="M6.5 17.5 10 15"/></svg>`;

    case 'mountain':
      return `<svg ${svgAttributes}><path d="M3 19h18"/><path d="M4.5 19 9.5 8.5l3 5 2.5-3.5L20 19"/></svg>`;

    case 'star':
      return `<svg ${svgAttributes}><path d="M12 3.5l2.4 5.1 5.6.6-4.2 3.8 1.2 5.6-4.9-2.9-4.9 2.9 1.2-5.6-4.2-3.8 5.6-.6L12 3.5Z"/></svg>`;

    case 'plus':
      return `<svg ${svgAttributes}><path d="M12 5v14M5 12h14"/></svg>`;

    case 'x':
      return `<svg ${svgAttributes}><path d="M6 6l12 12M18 6 6 18"/></svg>`;

    case 'trash':
      return `<svg ${svgAttributes}><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/><path d="M10 11v6M14 11v6"/></svg>`;

    case 'chevL':
      return `<svg ${svgAttributes}><path d="M15 5l-7 7 7 7"/></svg>`;

    case 'chevR':
      return `<svg ${svgAttributes}><path d="M9 5l7 7-7 7"/></svg>`;

    default:
      return '';
  }
}

/**
 * Return the icon name used by a workout category.
 */
export function iconFor(type) {
  return {
    strength: 'dumbbell',
    hiit: 'bolt',
    running: 'run',
    hiking: 'mountain',
    other: 'star',
  }[type] || 'star';
}
