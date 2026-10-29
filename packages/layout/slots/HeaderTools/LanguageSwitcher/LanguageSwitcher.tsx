import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { langmap } from '@plone/helpers';
import { Menu } from '@plone/components';
import { ChevrondownIcon } from '@plone/icons';
import config from '@plone/registry';
import { Button } from 'react-aria-components';
import type { RootLoader } from '@plone/aurora/app/root';

import styles from './LanguageSwitcher.module.css';
import { useLocation, useRouteLoaderData } from 'react-router';

export const normalizeLang = (language: string): string => {
  if (language.includes('_') || language.includes('-')) {
    const [first, second] = language.split(/[-_]/);
    return `${first}-${second.toUpperCase()}`;
  }
  return language;
};

/**
 * Up to this many languages, the switcher is a row of links; above it, a
 * dropdown menu, as a longer row does not fit the header.
 */
export const LANGUAGE_SWITCHER_MENU_THRESHOLD = 3;

type LanguageSelectorProps = {
  onClickAction?: () => void;
};

const LanguageSwitcher = (props: LanguageSelectorProps) => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const Link = config.getComponent('Link').component!;
  const MenuItem = config.getComponent('MenuItem').component!;
  const MenuTrigger = config.getComponent('MenuTrigger').component!;
  const rootData = useRouteLoaderData<RootLoader>('root');
  if (!rootData) {
    return null;
  }

  const { site } = rootData;
  if (!site) {
    return null;
  }
  const isMultilingual = site.features?.multilingual;
  const availableLanguages = site['plone.available_languages'] || [];
  // The active language, not the site default. The content language is
  // given by the URL — the switcher's own links target /<lang> roots — so
  // derive it from the first path segment when that matches an available
  // language. The i18n locale is deliberately NOT used: it is the
  // interface-strings locale (Accept-Language/cookie detection, synced
  // client-only in root.tsx) and is wrong during SSR.
  const normalizedAvailable = availableLanguages.map(normalizeLang);
  const pathSegment = normalizeLang(pathname.split('/')[1] || '');
  const currentLang = normalizedAvailable.includes(pathSegment)
    ? pathSegment
    : normalizeLang(site['plone.default_language'] || 'en');

  if (!isMultilingual) {
    return null;
  }

  const languages = availableLanguages.map((lang: string) => ({
    lang,
    name: langmap[lang]?.nativeName,
    label: t('layout.slots.headertools.languageSwitcher.switchTo', {
      lang: langmap[lang]?.nativeName.toLowerCase(),
    }),
    isCurrent: normalizeLang(lang) === currentLang,
  }));

  if (languages.length <= LANGUAGE_SWITCHER_MENU_THRESHOLD) {
    return (
      <div className={clsx(styles['language-switcher'])}>
        {languages.map(({ lang, name, label, isCurrent }) => (
          <Link
            aria-current={isCurrent ? 'true' : undefined}
            aria-label={label}
            className={clsx({ [styles.selected]: isCurrent })}
            href={`/${lang}`}
            onClick={props.onClickAction}
            key={`language-switcher-${lang}`}
          >
            {name}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className={clsx(styles['language-switcher'])}>
      <MenuTrigger placement="bottom end">
        <Button className={clsx(styles['language-switcher-trigger'])}>
          {langmap[currentLang]?.nativeName}
          <ChevrondownIcon
            aria-hidden="true"
            className={styles.chevron}
            size="sm"
          />
        </Button>
        {/* The trigger names the current language. No selection mode on
            the menu: in it, react-aria selects a link item instead of
            following it. */}
        <Menu className={clsx(styles['language-switcher-menu'])}>
          {languages.map(({ lang, name, label, isCurrent }) => (
            <MenuItem
              id={lang}
              aria-label={label}
              onAction={props.onClickAction}
              className={clsx(styles['language-switcher-item'], {
                [styles.selected]: isCurrent,
              })}
              href={`/${lang}`}
              key={`language-switcher-${lang}`}
            >
              {name}
            </MenuItem>
          ))}
        </Menu>
      </MenuTrigger>
    </div>
  );
};

export default LanguageSwitcher;
