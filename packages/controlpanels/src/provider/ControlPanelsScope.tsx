import { useRef } from 'react';
import type { ReactNode } from 'react';
import { UNSAFE_PortalProvider } from 'react-aria';

/** The class `dist/controlpanels.css` is scoped to. */
export const CONTROLPANELS_SCOPE = 'plone-controlpanels';

/**
 * Scopes the screens for `dist/controlpanels.css`, in apps without Tailwind
 * such as Volto: the styles apply inside it only. Popovers, dialogs and
 * sheets render in a container inside it too, instead of the document's
 * body, so they get the styles as well.
 */
export function ControlPanelsScope({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  const portal = useRef<HTMLDivElement>(null);
  return (
    <div
      className={
        className
          ? `
            ${CONTROLPANELS_SCOPE}
            ${className}
          `
          : CONTROLPANELS_SCOPE
      }
    >
      <UNSAFE_PortalProvider getContainer={() => portal.current}>
        {children}
      </UNSAFE_PortalProvider>
      <div ref={portal} />
    </div>
  );
}
