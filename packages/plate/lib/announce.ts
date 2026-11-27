/*
 * Announces a message to screen readers through a polite live region, for
 * changes that have no visible text of their own, such as "Panel moved to
 * position 2 of 3". The region is visually hidden and shared by every editor
 * on the page.
 */

const ANNOUNCER_ATTRIBUTE = 'data-plate-announcer';

let region: HTMLElement | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;

const getRegion = () => {
  if (region && document.body.contains(region)) return region;

  region = document.createElement('div');
  region.setAttribute(ANNOUNCER_ATTRIBUTE, '');
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', 'polite');
  Object.assign(region.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap',
    border: '0',
  });
  document.body.appendChild(region);
  return region;
};

export function announce(message: string) {
  if (typeof document === 'undefined' || !message) return;
  const target = getRegion();
  // Clearing the region first lets screen readers announce a message that
  // repeats the previous one.
  target.textContent = '';
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    target.textContent = message;
  }, 50);
}
