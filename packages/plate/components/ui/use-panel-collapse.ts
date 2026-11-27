import * as React from 'react';

const DURATION = 300;
const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Opens and closes an accordion panel's content region. A closed region is
 * `hidden="until-found"`, so find-in-page can reveal it, which calls
 * `onBeforeMatch`. Opening and closing animate the region's height, measured
 * in pixels, unless the user prefers reduced motion; closing keeps the
 * content visible until the region has shrunk. Toggling again while it
 * animates plays the animation back from where it is.
 */
export function usePanelCollapse(
  getRegion: () => HTMLElement | null | undefined,
  open: boolean,
  onBeforeMatch: () => void,
) {
  const getRegionRef = React.useRef(getRegion);
  getRegionRef.current = getRegion;
  const onBeforeMatchRef = React.useRef(onBeforeMatch);
  onBeforeMatchRef.current = onBeforeMatch;
  const openRef = React.useRef(open);
  const animation = React.useRef<Animation | null>(null);
  const mounted = React.useRef(false);

  React.useLayoutEffect(() => {
    openRef.current = open;
    const region = getRegionRef.current();
    if (!region) return;

    const settle = () => {
      animation.current = null;
      region.style.overflow = '';
      if (openRef.current) region.removeAttribute('hidden');
      else region.setAttribute('hidden', 'until-found');
    };

    if (open) region.removeAttribute('hidden');

    if (animation.current) {
      animation.current.reverse();
      return;
    }
    if (
      !mounted.current ||
      typeof region.animate !== 'function' ||
      prefersReducedMotion()
    ) {
      mounted.current = true;
      settle();
      return;
    }

    const style = getComputedStyle(region);
    const expanded = {
      height: `${region.offsetHeight}px`,
      paddingTop: style.paddingTop,
      paddingBottom: style.paddingBottom,
      opacity: 1,
    };
    const collapsed = {
      height: '0px',
      paddingTop: '0px',
      paddingBottom: '0px',
      opacity: 0,
    };
    region.style.overflow = 'clip';
    const running = region.animate(
      open ? [collapsed, expanded] : [expanded, collapsed],
      { duration: DURATION, easing: EASING },
    );
    running.onfinish = settle;
    running.oncancel = settle;
    animation.current = running;
  }, [open]);

  React.useEffect(() => {
    const region = getRegionRef.current();
    if (!region) return;
    const listener = () => onBeforeMatchRef.current();
    region.addEventListener('beforematch', listener);
    return () => region.removeEventListener('beforematch', listener);
  }, []);
}
