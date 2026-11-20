/**
 * The Aurora logo, gradient version, from the logo design work (not yet in
 * the repository). Each drawing is meant for a range of sizes:
 *
 * - `full` is for 48px and up: the sky, the sun's glow, a star and five
 *   reflections on the water.
 * - `tuned16` is redrawn on a 16px grid, with two reflections, so it stays
 *   sharp at exactly 16px.
 *
 * They are used as `data:` URIs, so their gradient ids cannot clash with ids
 * on the page.
 */
const full = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" role="img" aria-label="Aurora"><defs><clipPath id="a1c"><circle cx="100" cy="100" r="96"/></clipPath><linearGradient id="a1s" x1="0" y1="4" x2="0" y2="100" gradientUnits="userSpaceOnUse"><stop offset="0.000" stop-color="#1c2257"/><stop offset="0.167" stop-color="#2f3384"/><stop offset="0.333" stop-color="#563a96"/><stop offset="0.500" stop-color="#8a3f98"/><stop offset="0.667" stop-color="#c24a85"/><stop offset="0.833" stop-color="#ec6a6a"/><stop offset="1.000" stop-color="#f8a05e"/></linearGradient><radialGradient id="a1g" cx="100" cy="100" r="70" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffd59a" stop-opacity="0.85"/><stop offset="0.45" stop-color="#ff9a6a" stop-opacity="0.2975"/><stop offset="1" stop-color="#ff9a6a" stop-opacity="0"/></radialGradient><linearGradient id="a1w" x1="0" y1="100" x2="0" y2="196" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2c2f6e"/><stop offset="1" stop-color="#0d1430"/></linearGradient><linearGradient id="a1r" x1="0" x2="1"><stop offset="0" stop-color="#f8a05e" stop-opacity="0"/><stop offset=".5" stop-color="#ffc98a"/><stop offset="1" stop-color="#f8a05e" stop-opacity="0"/></linearGradient></defs><g clip-path="url(#a1c)"><rect width="200" height="100" fill="url(#a1s)"/><rect width="200" height="100" fill="url(#a1g)"/><rect y="100" width="200" height="100" fill="url(#a1w)"/><rect y="99.4" width="200" height="1.4" fill="#ffd59a" opacity=".9"/><rect x="40.0" y="106" width="120" height="2.6" rx="1.3" fill="url(#a1r)" opacity="0.9"/><rect x="58.0" y="115" width="84" height="2.4" rx="1.2" fill="url(#a1r)" opacity="0.7"/><rect x="72.0" y="125" width="56" height="2.2" rx="1.1" fill="url(#a1r)" opacity="0.55"/><rect x="83.0" y="136" width="34" height="2" rx="1.0" fill="url(#a1r)" opacity="0.4"/><rect x="91.0" y="148" width="18" height="1.8" rx="0.9" fill="url(#a1r)" opacity="0.3"/><path d="M132 29 Q132.9 33.1 137 34 Q132.9 34.9 132 39 Q131.1 34.9 127 34 Q131.1 33.1 132 29Z" fill="#fff3d6" opacity="1"/></g></svg>`;

const tuned16 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" role="img" aria-label="Aurora"><defs><clipPath id="f16c"><circle cx="8" cy="8" r="8"/></clipPath><linearGradient id="f16s" x1="0" y1="0" x2="0" y2="8" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2f3384"/><stop offset=".5" stop-color="#b2468c"/><stop offset="1" stop-color="#fbb168"/></linearGradient></defs><g clip-path="url(#f16c)"><rect width="16" height="8" fill="url(#f16s)"/><rect y="8" width="16" height="8" fill="#161d4a"/><rect x="3" y="10" width="10" height="1" fill="#f8a862"/><rect x="5" y="12" width="6" height="1" fill="#f8a862" opacity=".7"/></g></svg>`;

const dataUri = (svg: string) =>
  `data:image/svg+xml,${encodeURIComponent(svg)}`;

export const auroraLogo = {
  full: dataUri(full),
  tuned16: dataUri(tuned16),
};
