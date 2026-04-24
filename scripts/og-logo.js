/**
 * Abyss-themed edbzn compass rose, pre-colored for the generated social
 * previews (colors match the site's `[data-theme='abyss']` rules).
 *
 * Design:
 *   - Thin circular ring (hollow donut via evenodd)
 *   - Four small cardinal tick marks (N/E/S/W)
 *   - 8-point compass rose with two-tone halves; cardinals are wider than
 *     the diagonals for visual hierarchy
 *   - Red north ray for orientation
 *   - A transparent hole in the center — the OG background gradient shows
 *     through — produced via an SVG mask
 */
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" shape-rendering="geometricPrecision">
  <defs>
    <mask id="compass-hole" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
      <rect width="100" height="100" fill="white"/>
      <circle cx="50" cy="50" r="7" fill="black"/>
    </mask>
  </defs>
  <path d="M 50 8 A 42 42 0 1 0 50 92 A 42 42 0 1 0 50 8 Z M 50 12 A 38 38 0 1 1 50 88 A 38 38 0 1 1 50 12 Z" fill="#ffffff" fill-rule="evenodd"/>
  <g fill="#ffffff">
    <polygon points="49,2 51,2 51,8 49,8"/>
    <polygon points="92,49 98,49 98,51 92,51"/>
    <polygon points="49,92 51,92 51,98 49,98"/>
    <polygon points="2,49 8,49 8,51 2,51"/>
  </g>
  <g mask="url(#compass-hole)" fill="#ffffff">
    <polygon points="68,32 55.2,49.2 50.8,44.8"/>
    <polygon points="68,68 50.8,55.2 55.2,50.8"/>
    <polygon points="32,68 44.8,50.8 49.2,55.2"/>
    <polygon points="32,32 49.2,44.8 44.8,49.2"/>
    <polygon points="90,50 55,54.5 55,45.5"/>
    <polygon points="50,90 45.5,55 54.5,55"/>
    <polygon points="10,50 45,45.5 45,54.5"/>
    <polygon points="50,10 54.5,45 45.5,45" fill="#ff3344"/>
  </g>
</svg>`;

module.exports = { LOGO_SVG };
