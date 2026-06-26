/**
 * CMS Toolbar — CSS isolation via `all: initial` reset (no Shadow DOM).
 *
 * `all: initial` on the root element resets every inherited and non-inherited
 * CSS property to its spec default, preventing host-page styles from leaking
 * in. CSS Modules scopes toolbar class names so toolbar styles cannot leak out.
 *
 * The only gap vs Shadow DOM: CSS custom properties are not covered by
 * `all: initial`. Variables are namespaced `--plone-*` / `--quanta-*` so
 * host-page collision is negligible in practice.
 *
 * Without Shadow DOM, React Aria's overlay components (MenuTrigger, DialogTrigger,
 * Popover, Select…) work as designed — no event-retargeting patches, no custom
 * portal wiring, no offsetParent hacks.
 */

import { useTranslation } from 'react-i18next';
import styles from './Toolbar.module.css';
import './Toolbar-inner.css';
import { Pluggable } from '../Pluggable';

function ToolbarInner() {
  const { t } = useTranslation();

  return (
    <nav aria-label={t('layout.toolbar.label')} className="toolbar">
      <div className="toolbar-buttons">
        <div className="toolbar-region toolbar-top">
          <Pluggable name="toolbar-top" />
        </div>
        <div className="toolbar-region toolbar-bottom">
          <Pluggable name="toolbar-bottom" />
        </div>
      </div>
    </nav>
  );
}

const Toolbar = () => {
  return (
    <div id="toolbar" className={styles.toolbar}>
      <ToolbarInner />
    </div>
  );
};

export default Toolbar;
