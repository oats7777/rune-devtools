/** Inline SVG icon strings for panel toolbar buttons (16x16 viewBox). */

export const PANEL_ICONS = {
  /** Component Tree: hierarchy/tree icon */
  tree: `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="1" width="6" height="4" rx="1" stroke="currentColor" stroke-width="1.2"/>
    <rect x="1" y="11" width="5" height="4" rx="1" stroke="currentColor" stroke-width="1.2"/>
    <rect x="10" y="11" width="5" height="4" rx="1" stroke="currentColor" stroke-width="1.2"/>
    <path d="M8 5v2.5M8 7.5H3.5V11M8 7.5h4.5V11" stroke="currentColor" stroke-width="1.2"/>
  </svg>`,

  /** Data Inspector: code brackets icon */
  data: `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 2.5C3.5 2.5 3 3.5 3 4.5v2L2 8l1 1.5v2c0 1 .5 2 2 2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M11 2.5c1.5 0 2 1 2 2v2L14 8l-1 1.5v2c0 1-.5 2-2 2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="6.5" cy="8" r="0.75" fill="currentColor"/>
    <circle cx="9.5" cy="8" r="0.75" fill="currentColor"/>
  </svg>`,

  /** Event Monitor: lightning bolt icon */
  events: `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 1.5L4 9h3.5l-.5 5.5L12 7H8.5L9 1.5z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
  </svg>`,

  /** Redraw Tracker: refresh/cycle icon */
  redraw: `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 8A5 5 0 1 1 8 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M11 1.5L13.5 3.5 11 5.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  /** ListView Monitor: list icon */
  listview: `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="3" width="2" height="2" rx="0.5" fill="currentColor"/>
    <rect x="2" y="7" width="2" height="2" rx="0.5" fill="currentColor"/>
    <rect x="2" y="11" width="2" height="2" rx="0.5" fill="currentColor"/>
    <path d="M6.5 4h7.5M6.5 8h7.5M6.5 12h7.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
  </svg>`,

  /** DOM Highlight: crosshair/target icon */
  highlight: `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="5" stroke="currentColor" stroke-width="1.2"/>
    <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
    <path d="M8 1.5V4M8 12v2.5M1.5 8H4M12 8h2.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
  </svg>`,

  /** Timeline: clock icon */
  timeline: `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.2"/>
    <path d="M8 4.5V8l2.5 2.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  /** Close: X icon */
  close: `<svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
  </svg>`,
} as const;
