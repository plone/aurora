import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { Button } from 'react-aria-components';
import { MenuIcon } from '@plone/icons';
import type { SlotComponentProps } from '../SlotRenderer';
import config from '@plone/registry';
import styles from './Navigation.module.css';
import clsx from 'clsx';

type NavItem = {
  '@id': string;
  title: string;
};

const Navigation = (props: SlotComponentProps) => {
  const { content } = props;
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const Link = config.getComponent('Link').component!;
  const navItems = content?.['@components']?.navigation?.items || [];

  // The collapsed-header menu (shown below 48rem by header.css) is open only
  // for the path it was opened on, so a route change closes it by
  // construction — no effect to re-run. Null on the server and on the first
  // client render alike: the toggle hydrates closed deterministically.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);

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
        aria-controls="navigation-list"
        onPress={() => setOpenedOn(open ? null : pathname)}
      >
        <MenuIcon />
      </Button>
      <ul ref={panelRef} id="navigation-list" data-open={open || undefined}>
        {navItems.map((item: NavItem) => (
          <li key={item['@id']}>
            <Link href={item['@id']}>{item.title}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navigation;
