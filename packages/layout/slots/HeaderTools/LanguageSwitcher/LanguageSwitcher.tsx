import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { langmap } from '@plone/helpers';
import { Menu, MenuItem, MenuTrigger } from '@plone/components';
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

type LanguageSelectorProps = {
  onClickAction?: () => void;
};

const LanguageSwitcher = (props: LanguageSelectorProps) => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
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
  // given by the URL — the menu's own items target /<lang> roots — so
  // derive it from the first path segment when that matches an available
  // language. The i18n locale is deliberately NOT used: it is the
  // interface-strings locale (Accept-Language/cookie detection, synced
  // client-only in root.tsx) and is wrong during SSR.
  const normalizedAvailable = availableLanguages.map(normalizeLang);
  const pathSegment = normalizeLang(pathname.split('/')[1] || '');
  const currentLang = normalizedAvailable.includes(pathSegment)
    ? pathSegment
    : normalizeLang(site['plone.default_language'] || 'en');

  return isMultilingual ? (
    <div className={clsx(styles['language-switcher'])}>
      <MenuTrigger placement="bottom end">
        <Button className={clsx(styles['language-switcher-trigger'])}>
          {langmap[currentLang]?.nativeName}
          <svg
            aria-hidden="true"
            className={styles.chevron}
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
          >
            <path
              d="M2 4l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Button>
        <Menu
          className={clsx(styles['language-switcher-menu'])}
          onAction={() => props.onClickAction?.()}
        >
          {availableLanguages.map((lang: string) => (
            <MenuItem
              aria-label={t(
                'layout.slots.headertools.languageSwitcher.switchTo',
                {
                  lang: langmap[lang]?.nativeName.toLowerCase(),
                },
              )}
              className={clsx(styles['language-switcher-item'], {
                [styles.selected]: normalizeLang(lang) === currentLang,
              })}
              href={`/${lang}`}
              key={`language-switcher-${lang}`}
            >
              {langmap[lang]?.nativeName}
            </MenuItem>
          ))}
        </Menu>
      </MenuTrigger>
    </div>
  ) : null;
};

export default LanguageSwitcher;
