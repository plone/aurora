import type { ReactNode } from 'react';

interface DocumentTitleProps {
  children: ReactNode;
}

/**
 * The page's main heading, for views and routes that don't render blocks. It
 * renders the title block's markup, so it's styled and spaced like the title
 * of a page with blocks (`.slate-title` in `@plone/plate`'s `content.css`).
 */
export default function DocumentTitle({ children }: DocumentTitleProps) {
  return (
    <h1 className="documentFirstHeading slate-title">
      <div className="block-inner-container">{children}</div>
    </h1>
  );
}
