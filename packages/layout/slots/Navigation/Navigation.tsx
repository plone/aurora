import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useRouteLoaderData } from 'react-router';
import { Button } from 'react-aria-components';
import { Link } from '@plone/components';
import { MenuIcon } from '@plone/icons';
import type { RootLoader } from '@plone/aurora/app/root';
import SlotRenderer, { type SlotComponentProps } from '../SlotRenderer';
import styles from './Navigation.module.css';
import clsx from 'clsx';

type NavItem = {
  '@id': string;
  title: string;
};

const Navigation = (props: SlotComponentProps) => {
  const { content, location } = props;
  const { t } = useTranslation();
  const rootData = useRouteLoaderData<RootLoader>('root');
  const { pathname } = useLocation();
  const navItems = content?.['@components']?.navigation?.items || [];

  // The collapsed-header menu (shown below 48rem by header.css) is open only
  // for the path it was opened on, so a route change closes it by
  // construction — no effect to re-run. Null on the server and on the first
  // client render alike: the toggle hydrates closed deterministically.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape dismisses the open panel wherever focus is, the way an overlay
  // does; the listener exists only while it is open.
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Focus inside the panel would be lost when it hides: hand it back
        // to the toggle.
        if (panelRef.current?.contains(document.activeElement)) {
          toggleRef.current?.focus();
        }
        setOpenedOn(null);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <nav
      id="navigation"
      aria-label="navigation"
      className={clsx(styles.navigation, 'navigation')}
    >
      <Button
        ref={toggleRef}
        className={clsx(styles.toggle, 'navigation-toggle')}
        aria-label={t('layout.slots.navigation.menu', { defaultValue: 'Menu' })}
        aria-expanded={open}
        aria-controls="navigation-panel"
        onPress={() => setOpenedOn(open ? null : pathname)}
      >
        <MenuIcon />
      </Button>
      {/* The panel the toggle opens below 48rem. Above it, the wrapper and
          the tools are out of the layout (header.css), and the list is the
          usual row. */}
      <div
        ref={panelRef}
        id="navigation-panel"
        className="navigation-panel"
        data-open={open || undefined}
      >
        <ul id="navigation-list">
          {navItems.map((item: NavItem) => (
            <li key={item['@id']}>
              <Link href={item['@id']}>{item.title}</Link>
            </li>
          ))}
        </ul>
        {/* On phones the header row has no room for the account tools and
            the language switcher, so the panel shows them instead; the
            header row shows them on wider screens. Both render the same
            slots, and CSS picks one, so the server and the client render
            the same markup. */}
        <div className="navigation-panel-tools">
          <SlotRenderer
            name={
              rootData?.isAuthenticated
                ? 'authenticatedTools'
                : 'anonymousTools'
            }
            content={content}
            location={location}
          />
          <SlotRenderer
            name="languageSwitcher"
            content={content}
            location={location}
          />
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
