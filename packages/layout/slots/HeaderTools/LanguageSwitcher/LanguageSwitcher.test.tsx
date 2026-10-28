import '@testing-library/jest-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import LanguageSwitcher, { normalizeLang } from './LanguageSwitcher';

vi.mock('./LanguageSwitcher.module.css', () => ({
  default: {
    selected: 'selected',
    'language-switcher': 'language-switcher',
    'language-switcher-trigger': 'language-switcher-trigger',
    'language-switcher-menu': 'language-switcher-menu',
    'language-switcher-item': 'language-switcher-item',
    chevron: 'chevron',
  },
}));

const MANY_LANGUAGES = ['en', 'sv', 'ja', 'ko', 'es', 'pt', 'pt-br', 'sk'];
let availableLanguages = MANY_LANGUAGES;

beforeEach(() => {
  availableLanguages = MANY_LANGUAGES;
});

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
      'plone.available_languages': availableLanguages,
      'plone.default_language': 'en',
    },
  }),
}));

const renderAt = (path: string, onClickAction?: () => void) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <LanguageSwitcher onClickAction={onClickAction} />
    </MemoryRouter>,
  );

const trigger = () => screen.getByRole('button');

describe('normalizeLang', () => {
  test('normalizes underscore and dash forms to xx-YY', () => {
    expect(normalizeLang('zh_cn')).toBe('zh-CN');
    expect(normalizeLang('zh-cn')).toBe('zh-CN');
    expect(normalizeLang('sv')).toBe('sv');
  });
});

describe('LanguageSwitcher trigger', () => {
  test('is a single menu button showing the current native name', () => {
    renderAt('/sv/some-page');
    expect(trigger()).toHaveTextContent('Svenska');
    expect(trigger()).toHaveAttribute('aria-haspopup');
    // No always-visible row of language links anymore.
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  test('falls back to the site default off any language root', () => {
    renderAt('/');
    expect(trigger()).toHaveTextContent('English');
  });

  test('ignores a first segment that is not an available language', () => {
    renderAt('/login');
    expect(trigger()).toHaveTextContent('English');
  });

  test('shows the Brazilian Portuguese native name for a pt-br URL', () => {
    renderAt('/pt-br/alguma-pagina');
    expect(trigger()).toHaveTextContent('Português (Brasil)');
  });
});

describe('LanguageSwitcher menu', () => {
  test('opens on click and lists every available language natively', () => {
    renderAt('/sv/some-page');
    fireEvent.click(trigger());
    const items = screen.getAllByRole('menuitem');
    expect(items).toHaveLength(8);
    const names = items.map((i) => i.textContent);
    expect(names).toEqual([
      'English',
      'Svenska',
      '日本語',
      '한국어',
      'Español',
      'Português',
      'Português (Brasil)',
      'Slovenčina',
    ]);
  });

  test('items link to the language roots by raw token', () => {
    renderAt('/sv/some-page');
    fireEvent.click(trigger());
    const brazilian = screen
      .getAllByRole('menuitem')
      .find((i) => i.textContent === 'Português (Brasil)');
    expect(brazilian).toHaveAttribute('href', '/pt-br');
  });

  test('marks the language root the URL is under, not the site default', () => {
    renderAt('/sv/some-page');
    fireEvent.click(trigger());
    const items = screen.getAllByRole('menuitem');
    const svenska = items.find((i) => i.textContent === 'Svenska');
    const english = items.find((i) => i.textContent === 'English');
    expect(svenska).toHaveClass('selected');
    expect(english).not.toHaveClass('selected');
  });
});

describe('LanguageSwitcher onClickAction', () => {
  test('fires when a language is picked from the menu', () => {
    const onClickAction = vi.fn();
    renderAt('/sv/some-page', onClickAction);
    fireEvent.click(trigger());
    const english = screen
      .getAllByRole('menuitem')
      .find((i) => i.textContent === 'English')!;
    fireEvent.click(english);
    expect(onClickAction).toHaveBeenCalledTimes(1);
  });

  test('fires when a language link is clicked in the row', () => {
    availableLanguages = ['en', 'sv'];
    const onClickAction = vi.fn();
    renderAt('/sv/some-page', onClickAction);
    fireEvent.click(screen.getByText('English'));
    expect(onClickAction).toHaveBeenCalledTimes(1);
  });
});

describe('LanguageSwitcher with up to three languages', () => {
  beforeEach(() => {
    availableLanguages = ['en', 'sv', 'pt-br'];
  });

  test('is a row of links to the language roots, without a menu', () => {
    renderAt('/sv/some-page');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    const links = screen.getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual([
      'English',
      'Svenska',
      'Português (Brasil)',
    ]);
    expect(links.map((l) => l.getAttribute('href'))).toEqual([
      '/en',
      '/sv',
      '/pt-br',
    ]);
  });

  test('marks the language root the URL is under', () => {
    renderAt('/sv/some-page');
    expect(screen.getByText('Svenska')).toHaveClass('selected');
    expect(screen.getByText('Svenska')).toHaveAttribute('aria-current', 'true');
    expect(screen.getByText('English')).not.toHaveClass('selected');
    expect(screen.getByText('English')).not.toHaveAttribute('aria-current');
  });

  test('falls back to the site default off any language root', () => {
    renderAt('/');
    expect(screen.getByText('English')).toHaveAttribute('aria-current', 'true');
  });
});

describe('LanguageSwitcher threshold', () => {
  test('switches to the menu from four languages', () => {
    availableLanguages = ['en', 'sv', 'pt-br', 'sk'];
    renderAt('/sv/some-page');
    expect(trigger()).toHaveTextContent('Svenska');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
