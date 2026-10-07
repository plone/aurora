import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { langmap } from '@plone/helpers';
import { Link } from '@plone/components';
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

  return isMultilingual ? (
    <div className={clsx(styles['language-switcher'])}>
      {availableLanguages.map((lang: string) => {
        return (
          <Link
            aria-label={t(
              'layout.slots.headertools.languageSwitcher.switchTo',
              {
                lang: langmap[lang]?.nativeName.toLowerCase(),
              },
            )}
            className={clsx({
              [styles.selected]: normalizeLang(lang) === currentLang,
            })}
            href={`/${lang}`}
            onClick={props.onClickAction}
            key={`language-switcher-${lang}`}
          >
            {langmap[lang]?.nativeName}
          </Link>
        );
      })}
    </div>
  ) : null;
};

export default LanguageSwitcher;
