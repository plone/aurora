import '@testing-library/jest-dom';
import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import LanguageSwitcher, { normalizeLang } from './LanguageSwitcher';

vi.mock('./LanguageSwitcher.module.css', () => ({
  default: { selected: 'selected', 'language-switcher': 'language-switcher' },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useRouteLoaderData: () => ({
    site: {
      features: { multilingual: true },
      'plone.available_languages': ['en', 'sv', 'ja', 'ko'],
      'plone.default_language': 'en',
    },
  }),
}));

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <LanguageSwitcher />
    </MemoryRouter>,
  );

describe('normalizeLang', () => {
  test('normalizes underscore and dash forms to xx-YY', () => {
    expect(normalizeLang('zh_cn')).toBe('zh-CN');
    expect(normalizeLang('zh-cn')).toBe('zh-CN');
    expect(normalizeLang('sv')).toBe('sv');
  });
});

describe('LanguageSwitcher', () => {
  test('marks the language root the URL is under, not the site default', () => {
    renderAt('/sv/some-page');
    expect(screen.getByText('Svenska')).toHaveClass('selected');
    expect(screen.getByText('English')).not.toHaveClass('selected');
  });

  test('falls back to the site default off any language root', () => {
    renderAt('/');
    expect(screen.getByText('English')).toHaveClass('selected');
    expect(screen.getByText('Svenska')).not.toHaveClass('selected');
  });

  test('ignores a first segment that is not an available language', () => {
    renderAt('/login');
    expect(screen.getByText('English')).toHaveClass('selected');
  });

  test('marks only the active language as the current one for assistive technology', () => {
    renderAt('/sv/some-page');
    expect(screen.getByText('Svenska')).toHaveAttribute('aria-current', 'true');
    expect(screen.getByText('English')).not.toHaveAttribute('aria-current');
  });
});
