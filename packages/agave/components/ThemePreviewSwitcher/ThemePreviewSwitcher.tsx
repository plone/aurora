/*
 * TEMPORARY: a floating toolbar to preview Agave's skins, colour modes and the
 * sticky header setting. It writes the `data-skin`, `data-mode` and
 * `data-sticky` attributes on <html> and remembers them in localStorage.
 * Remove this folder and its registration in `index.ts` when it's no longer
 * needed.
 */
import { useEffect, useState } from 'react';
import './ThemePreviewSwitcher.css';

const SKINS = [
  { value: 'default', label: 'Default' },
  { value: 'nieve', label: 'Nieve' },
  { value: 'mercado', label: 'Mercado' },
];

type Mode = 'light' | 'dark';

const isMode = (value: string | null): value is Mode =>
  value === 'light' || value === 'dark';

function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private windows may block storage; the setting still applies.
  }
}

const ThemePreviewSwitcher = () => {
  // Server and first client render agree; the stored settings apply on mount.
  const [skin, setSkin] = useState('default');
  // Without a stored choice, the mode follows the OS colour scheme: no
  // `data-mode` is written.
  const [mode, setMode] = useState<Mode | null>(null);
  const [prefersDark, setPrefersDark] = useState(false);
  const [sticky, setSticky] = useState(true);

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-color-scheme: dark)');
    setPrefersDark(Boolean(query?.matches));
    const onChange = (event: MediaQueryListEvent) =>
      setPrefersDark(event.matches);
    query?.addEventListener('change', onChange);

    const storedSkin = read('agave:skin');
    // Ignore skins saved under a name that no longer exists.
    setSkin(
      SKINS.some((s) => s.value === storedSkin) ? storedSkin! : 'default',
    );
    const storedMode = read('agave:mode');
    setMode(isMode(storedMode) ? storedMode : null);
    setSticky(read('agave:sticky') !== 'off');
    return () => query?.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-skin', skin);
    if (mode) root.setAttribute('data-mode', mode);
    else root.removeAttribute('data-mode');
    root.setAttribute('data-sticky', sticky ? 'on' : 'off');
  }, [skin, mode, sticky]);

  // Leave <html> as it was, so the settings don't follow the visitor into
  // the CMSUI.
  useEffect(
    () => () => {
      const root = document.documentElement;
      root.removeAttribute('data-skin');
      root.removeAttribute('data-mode');
      root.removeAttribute('data-sticky');
    },
    [],
  );

  const dark = (mode ?? (prefersDark ? 'dark' : 'light')) === 'dark';

  return (
    <div
      className="agave-preview-switcher"
      role="group"
      aria-label="Theme preview controls"
    >
      <label htmlFor="agave-preview-skin">Skin</label>
      <span className="sel">
        <select
          id="agave-preview-skin"
          value={skin}
          onChange={(e) => {
            setSkin(e.target.value);
            save('agave:skin', e.target.value);
          }}
        >
          {SKINS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </span>
      <button
        type="button"
        aria-label="Toggle dark mode"
        aria-pressed={dark}
        onClick={() => {
          const next: Mode = dark ? 'light' : 'dark';
          setMode(next);
          save('agave:mode', next);
        }}
      >
        {dark ? (
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        ) : (
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
          </svg>
        )}
        <span>{dark ? 'Light' : 'Dark'}</span>
      </button>
      <label htmlFor="agave-preview-sticky">Sticky menu</label>
      <button
        type="button"
        id="agave-preview-sticky"
        className="toggle"
        role="switch"
        aria-checked={sticky}
        onClick={() => {
          setSticky(!sticky);
          save('agave:sticky', sticky ? 'off' : 'on');
        }}
      >
        <span>{sticky ? 'Yes' : 'No'}</span>
      </button>
    </div>
  );
};

export default ThemePreviewSwitcher;
