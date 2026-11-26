/*
 * TEMPORARY testing tool — remove together with its registration in index.ts.
 *
 * A floating panel to try each skin's main tokens: the base colours
 * (background, foreground, brand, and atmosphere where the skin has one) in
 * light and dark mode, and the fonts, base font size, line height, corner
 * radius and spacing unit. It also switches the
 * skin and the colour mode on <html>. It overrides only the tokens you change,
 * through an unlayered <style> tag, so content.css stays the source of truth.
 */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type Skin = 'default' | 'nieve' | 'xmas';
type Mode = 'light' | 'dark';
type Key = 'background' | 'foreground' | 'brand' | 'atmosphere';
type Pair = [light: string, dark: string];
type Palette = Partial<Record<Key, Pair>>;
type Overrides = Record<
  Skin,
  Partial<Record<Key, Partial<Record<Mode, string>>>>
>;
type TokenKey =
  'fontBody' | 'fontHeading' | 'fontSize' | 'lineHeight' | 'radius' | 'space';
type Tokens = Record<Skin, Partial<Record<TokenKey, string>>>;

const KEYS: Key[] = ['background', 'foreground', 'brand', 'atmosphere'];

// Mirrors the values in styles/content.css
const DEFAULTS: Record<Skin, Palette> = {
  default: {
    background: ['#ffffff', '#0b1314'],
    foreground: ['#0f1a1c', '#e8f0ef'],
    brand: ['#1f6763', '#8fd0c6'],
    atmosphere: ['#99d0db', '#134a55'],
  },
  nieve: {
    background: ['#f4f5f5', '#0e1011'],
    foreground: ['#111416', '#eceeef'],
    brand: ['#46605d', '#a3bab7'],
    // no atmosphere: Nieve's background is plain
  },
  xmas: {
    background: ['#fbf6ec', '#13201a'],
    foreground: ['#2a1a14', '#f1e8d8'],
    brand: ['#9e1b32', '#f08a9b'],
    // no atmosphere: the page is plain, the snow is an overlay
  },
};

// Mirrors styles/content.css; fonts are the skin's first choice, which falls
// back to the bundled Funnel until it's installed
const TOKEN_DEFAULTS: Record<Skin, Record<TokenKey, string>> = {
  default: {
    fontBody: 'Figtree',
    fontHeading: 'body',
    fontSize: '17.5',
    lineHeight: '1.6',
    radius: '14',
    space: '16',
  },
  nieve: {
    fontBody: 'Geist',
    fontHeading: 'body',
    fontSize: '17',
    lineHeight: '1.6',
    radius: '0',
    space: '16',
  },
  xmas: {
    fontBody: 'Source Sans 3',
    fontHeading: 'Playfair Display',
    fontSize: '17',
    lineHeight: '1.6',
    radius: '8',
    space: '16',
  },
};

// `google` loads the face from Google Fonts so it shows even when not installed
const FONTS: { name: string; stack: string; google?: string }[] = [
  { name: 'Funnel', stack: "'Funnel', system-ui, sans-serif" },
  {
    name: 'Figtree',
    stack: "'Figtree', 'Funnel', system-ui, sans-serif",
    google: 'Figtree:ital,wght@0,300..900;1,300..900',
  },
  {
    name: 'Geist',
    stack: "'Geist', 'Funnel', system-ui, sans-serif",
    google: 'Geist:wght@100..900',
  },
  {
    name: 'Inter',
    stack: "'Inter', 'Funnel', system-ui, sans-serif",
    google: 'Inter:ital,wght@0,100..900;1,100..900',
  },
  {
    name: 'Source Sans 3',
    stack: "'Source Sans 3', 'Funnel', system-ui, sans-serif",
    google: 'Source+Sans+3:ital,wght@0,200..900;1,200..900',
  },
  {
    name: 'Playfair Display',
    stack: "'Playfair Display', Georgia, 'Times New Roman', serif",
    google: 'Playfair+Display:ital,wght@0,400..900;1,400..900',
  },
  {
    name: 'Source Serif 4',
    stack: "'Source Serif 4', Georgia, serif",
    google: 'Source+Serif+4:ital,wght@0,200..900;1,200..900',
  },
  {
    name: 'Fraunces',
    stack: "'Fraunces', Georgia, serif",
    google: 'Fraunces:ital,wght@0,100..900;1,100..900',
  },
  {
    name: 'System UI',
    stack: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  },
  { name: 'Georgia', stack: "Georgia, 'Times New Roman', serif" },
];

const fontStack = (name: string) =>
  FONTS.find((f) => f.name === name)?.stack ??
  `'${name}', 'Funnel', sans-serif`;

// Range sliders; space is written as rem (16px = 1rem)
const RANGES: Record<
  'fontSize' | 'lineHeight' | 'radius' | 'space',
  { label: string; min: number; max: number; step: number; unit: string }
> = {
  fontSize: { label: 'Font size', min: 14, max: 22, step: 0.5, unit: 'px' },
  lineHeight: { label: 'Line height', min: 1.2, max: 2, step: 0.05, unit: '' },
  radius: { label: 'Radius', min: 0, max: 32, step: 1, unit: 'px' },
  space: { label: 'Spacing', min: 12, max: 24, step: 1, unit: 'px' },
};

const round = (n: number) => Math.round(n * 1000) / 1000;

// The block gaps grow with the font size, not with --space (content.css,
// "Spacing and layout values"); the spacing slider scales them by the same
// factor as --space
const HEADING_SIZES = ['3xl', '2xl', 'xl', 'lg', 'md'];
const blockSpacing = (f: number) =>
  [
    `--block-spacing: calc(var(--font-size) * ${round(1.3 * f)});`,
    ...HEADING_SIZES.map(
      (size, i) =>
        `--block-h${i + 1}-spacing-before: calc(var(--font-size-${size}) * ${round(1.5 * f)});`,
    ),
    `--block-h6-spacing-before: calc(var(--font-size) * ${round(1.5 * f)});`,
  ].join('\n');

// The four line heights of content.css, scaled together from the body's 1.6
const lineHeights = (v: number) => {
  const r = v / 1.6;
  return [
    `--line-height: ${round(v)};`,
    `--line-height-prose: ${round(1.7 * r)};`,
    `--line-height-snug: ${round(1.35 * r)};`,
    `--line-height-tight: ${round(1.1 * r)};`,
  ].join('\n');
};

const TOKEN_CSS: Record<TokenKey, (v: string) => string> = {
  fontBody: (v) => `--font-body: ${fontStack(v)};`,
  fontHeading: (v) =>
    `--font-heading: ${v === 'body' ? 'var(--font-body)' : fontStack(v)};`,
  fontSize: (v) => `--font-size: ${v}px;`,
  lineHeight: (v) => lineHeights(Number(v)),
  radius: (v) => `--radius: ${v}px;`,
  space: (v) => {
    const f = Number(v) / 16;
    return f === 1
      ? '--space: 1rem;'
      : `--space: ${round(f)}rem;\n${blockSpacing(f)}`;
  },
};

const STORAGE_KEY = 'agave-skin-tuner';

const rgba = (hex: string, pct: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255} / ${pct}%)`;
};
const ld = (light: string, dark: string) => `light-dark(${light}, ${dark})`;
const ldA = ([l, d]: Pair, lp: number, dp: number) =>
  ld(rgba(l, lp), rgba(d, dp));

// The tokens each skin builds from its atmosphere colour (kept in sync with
// content.css by hand)
const ATMOSPHERE: Partial<Record<Skin, (a: Pair) => string>> = {
  default: (a) => `
    --background-image:
      radial-gradient(130% 1300px at 25% -560px, ${ld(a[0], a[1])} 0%,
        ${ldA(a, 62, 52)} 40%, ${ldA(a, 36, 30)} 55%, ${ldA(a, 14, 12)} 70%,
        transparent 86%),
      radial-gradient(100% 680px at 50% calc(100% + 120px), ${ldA(a, 68, 68)} 0%,
        ${ldA(a, 34, 30)} 45%, transparent 80%);
    --callout-background: color-mix(in oklab, ${ld(a[0], a[1])} 24%, var(--background));
    --quote-image: radial-gradient(200% 180% at -25% -35%, ${ldA(a, 34, 34)} 0%,
      ${ldA(a, 21, 18)} 48%, transparent 86%);`,
};

// The colours a skin uses: Atmosphere only where the skin has one
const keysFor = (skin: Skin) =>
  KEYS.filter((k) => k !== 'atmosphere' || ATMOSPHERE[skin]);

const SELECTOR: Record<Skin, string> = {
  default: 'html:root:not([data-skin]) :is(.app-slot, .content-area)',
  nieve: "html:root[data-skin='nieve'] :is(.app-slot, .content-area)",
  xmas: "html:root[data-skin='xmas'] :is(.app-slot, .content-area)",
};

const SKINS = Object.keys(SELECTOR) as Skin[];

const value = (o: Overrides, skin: Skin, key: Key, mode: Mode) =>
  o[skin][key]?.[mode] ?? DEFAULTS[skin][key]![mode === 'light' ? 0 : 1];

const pair = (o: Overrides, skin: Skin, key: Key): Pair => [
  value(o, skin, key, 'light'),
  value(o, skin, key, 'dark'),
];

const token = (t: Tokens, skin: Skin, key: TokenKey) =>
  t[skin][key] ?? TOKEN_DEFAULTS[skin][key];

function buildCss(o: Overrides, t: Tokens) {
  return SKINS.map((skin) => {
    const colours = keysFor(skin)
      .filter((k) => o[skin][k])
      .map((k) => {
        const p = pair(o, skin, k);
        return k === 'atmosphere'
          ? ATMOSPHERE[skin]!(p)
          : `--${k}: ${ld(p[0], p[1])};`;
      });
    const others = (Object.keys(t[skin]) as TokenKey[]).map((k) =>
      TOKEN_CSS[k](token(t, skin, k)),
    );
    const decls = [...colours, ...others];
    return decls.length ? `${SELECTOR[skin]} {${decls.join('\n')}}` : '';
  }).join('\n');
}

// The Google Fonts stylesheet for the active skin's web fonts, its own
// included, so the preview shows the intended faces, not the Funnel fallback
function fontsHref(t: Tokens, skin: Skin) {
  const families = new Set<string>();
  for (const k of ['fontBody', 'fontHeading'] as const) {
    const g = FONTS.find((f) => f.name === token(t, skin, k))?.google;
    if (g) families.add(g);
  }
  if (!families.size) return '';
  const q = [...families].map((f) => `family=${f}`).join('&');
  return `https://fonts.googleapis.com/css2?${q}&display=swap`;
}

const EMPTY: Overrides = { default: {}, nieve: {}, xmas: {} };
const EMPTY_TOKENS: Tokens = { default: {}, nieve: {}, xmas: {} };

function load(): {
  overrides?: Overrides;
  tokens?: Tokens;
  skin?: Skin;
  mode?: Mode;
} | null {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

function headElement<T extends HTMLElement>(id: string, tag: string) {
  let el = document.getElementById(id) as T | null;
  if (!el) {
    el = document.createElement(tag) as T;
    el.id = id;
    document.head.appendChild(el);
  }
  return el;
}

const SkinTuner = () => {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(true);
  const [skin, setSkin] = useState<Skin>('default');
  const [mode, setMode] = useState<Mode>('light');
  const [overrides, setOverrides] = useState<Overrides>(EMPTY);
  const [tokens, setTokens] = useState<Tokens>(EMPTY_TOKENS);
  const [copied, setCopied] = useState(false);

  // Start from what <html> says, then from what was saved
  useEffect(() => {
    const html = document.documentElement;
    const saved = load();
    setSkin(
      saved?.skin ??
        (SKINS.includes(html.dataset.skin as Skin)
          ? (html.dataset.skin as Skin)
          : 'default'),
    );
    setMode(
      saved?.mode ??
        (html.dataset.mode === 'dark' || html.classList.contains('dark')
          ? 'dark'
          : 'light'),
    );
    if (saved?.overrides) setOverrides({ ...EMPTY, ...saved.overrides });
    if (saved?.tokens) setTokens({ ...EMPTY_TOKENS, ...saved.tokens });
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const html = document.documentElement;
    if (skin === 'default') delete html.dataset.skin;
    else html.dataset.skin = skin;
    if (mode === 'dark') html.dataset.mode = 'dark';
    else delete html.dataset.mode;

    headElement<HTMLStyleElement>(STORAGE_KEY, 'style').textContent = buildCss(
      overrides,
      tokens,
    );

    const href = fontsHref(tokens, skin);
    const link = document.getElementById(`${STORAGE_KEY}-fonts`);
    if (href) {
      const l = headElement<HTMLLinkElement>(`${STORAGE_KEY}-fonts`, 'link');
      l.rel = 'stylesheet';
      if (l.getAttribute('href') !== href) l.href = href;
    } else link?.remove();

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ overrides, tokens, skin, mode }),
      );
    } catch {
      // storage unavailable: the tool still works for this page view
    }
  }, [mounted, skin, mode, overrides, tokens]);

  if (!mounted) return null;

  const set = (key: Key, hex: string) =>
    setOverrides((o) => ({
      ...o,
      [skin]: { ...o[skin], [key]: { ...o[skin][key], [mode]: hex } },
    }));

  const setToken = (key: TokenKey, v: string) =>
    setTokens((t) => {
      const next = { ...t[skin] };
      if (v === TOKEN_DEFAULTS[skin][key]) delete next[key];
      else next[key] = v;
      return { ...t, [skin]: next };
    });

  const resetSkin = () => {
    setOverrides((o) => ({ ...o, [skin]: {} }));
    setTokens((t) => ({ ...t, [skin]: {} }));
  };

  const copy = async () => {
    const colours = keysFor(skin).map((k) => {
      const [l, d] = pair(overrides, skin, k);
      return k === 'atmosphere'
        ? `/* atmosphere: light-dark(${l}, ${d}) */`
        : `--${k}: light-dark(${l}, ${d});`;
    });
    const others = (Object.keys(TOKEN_CSS) as TokenKey[]).map((k) =>
      TOKEN_CSS[k](token(tokens, skin, k)),
    );
    try {
      await navigator.clipboard.writeText(
        `/* ${skin} */\n${[...colours, ...others].join('\n')}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard blocked: values stay visible in the panel
    }
  };

  const changedCount =
    keysFor(skin).filter((k) => overrides[skin][k]).length +
    Object.keys(tokens[skin]).length;

  const fontSelect = (key: 'fontBody' | 'fontHeading', label: string) => (
    <label className="ast-row ast-token">
      <span className="ast-name">
        {label}
        {tokens[skin][key] !== undefined && ' •'}
      </span>
      <select
        value={token(tokens, skin, key)}
        onChange={(e) => setToken(key, e.target.value)}
      >
        {key === 'fontHeading' && <option value="body">Same as body</option>}
        {FONTS.map((f) => (
          <option key={f.name} value={f.name}>
            {f.name}
          </option>
        ))}
      </select>
    </label>
  );

  return createPortal(
    <div className="agave-skin-tuner" data-open={open}>
      <style>{PANEL_CSS}</style>
      <div className="ast-head">
        <strong>Skin tuner</strong>
        <button type="button" onClick={() => setOpen((v) => !v)}>
          {open ? '–' : '+'}
        </button>
      </div>
      {open && (
        <>
          <Segmented
            options={SKINS}
            value={skin}
            onChange={(v) => setSkin(v as Skin)}
          />
          <Segmented
            options={['light', 'dark']}
            value={mode}
            onChange={(v) => setMode(v as Mode)}
          />
          {keysFor(skin).map((key) => {
            const hex = value(overrides, skin, key, mode);
            const changed = overrides[skin][key]?.[mode] !== undefined;
            return (
              <label key={key} className="ast-row">
                <input
                  type="color"
                  value={hex}
                  onChange={(e) => set(key, e.target.value)}
                />
                <span className="ast-name">
                  {key}
                  {changed && ' •'}
                </span>
                <input
                  className="ast-hex"
                  defaultValue={hex}
                  key={hex}
                  spellCheck={false}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (/^#[0-9a-f]{6}$/i.test(v)) set(key, v.toLowerCase());
                    else e.target.value = hex;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                  }}
                />
              </label>
            );
          })}
          <hr />
          {fontSelect('fontBody', 'Body font')}
          {fontSelect('fontHeading', 'Heading font')}
          {(Object.keys(RANGES) as (keyof typeof RANGES)[]).map((key) => {
            const r = RANGES[key];
            const v = token(tokens, skin, key);
            return (
              <label key={key} className="ast-row ast-range">
                <span className="ast-name">
                  {r.label}
                  {tokens[skin][key] !== undefined && ' •'}
                </span>
                <input
                  type="range"
                  min={r.min}
                  max={r.max}
                  step={r.step}
                  value={v}
                  onChange={(e) => setToken(key, e.target.value)}
                />
                <span className="ast-value">
                  {v}
                  {r.unit}
                </span>
              </label>
            );
          })}
          <div className="ast-actions">
            <button type="button" onClick={copy}>
              {copied ? 'Copied' : 'Copy values'}
            </button>
            <button type="button" onClick={resetSkin} disabled={!changedCount}>
              Reset {skin}
            </button>
          </div>
        </>
      )}
    </div>,
    document.body,
  );
};

const Segmented = ({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="ast-seg" role="group">
    {options.map((o) => (
      <button
        key={o}
        type="button"
        aria-pressed={o === value}
        onClick={() => onChange(o)}
      >
        {o}
      </button>
    ))}
  </div>
);

// Fixed neutral colours and sizes so the panel doesn't follow the skin it's
// tuning
const PANEL_CSS = `
.agave-skin-tuner {
  position: fixed; left: 66px; bottom: 16px; z-index: 2147483000;
  width: 252px; max-height: calc(100vh - 32px); overflow-y: auto;
  padding: 10px; display: grid; gap: 8px; box-sizing: border-box;
  background: rgb(24 24 27 / 92%); color: #f4f4f5;
  border: 1px solid rgb(255 255 255 / 12%); border-radius: 10px;
  box-shadow: 0 10px 30px rgb(0 0 0 / 35%);
  backdrop-filter: blur(10px);
  font: 12px/1.3 system-ui, -apple-system, 'Segoe UI', sans-serif;
  letter-spacing: normal; text-align: start;
  color-scheme: dark;
}
.agave-skin-tuner[data-open='false'] { width: auto; }
.agave-skin-tuner button, .agave-skin-tuner select {
  font: inherit; color: inherit; cursor: pointer;
  background: rgb(255 255 255 / 8%); border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 6px; padding: 4px 8px;
}
.agave-skin-tuner select { padding: 3px 4px; min-width: 0; width: 100%; }
.agave-skin-tuner button:disabled { opacity: 0.4; cursor: default; }
.agave-skin-tuner hr { width: 100%; margin: 2px 0; border: 0; border-top: 1px solid rgb(255 255 255 / 12%); }
.agave-skin-tuner .ast-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.agave-skin-tuner .ast-head button { padding: 0 8px; line-height: 20px; }
.agave-skin-tuner .ast-seg { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 2px;
  padding: 2px; background: rgb(255 255 255 / 6%); border-radius: 7px; }
.agave-skin-tuner .ast-seg button { border-color: transparent; background: transparent; text-transform: capitalize; }
.agave-skin-tuner .ast-seg button[aria-pressed='true'] { background: #f4f4f5; color: #18181b; }
.agave-skin-tuner .ast-row { display: grid; grid-template-columns: 28px 1fr 72px; align-items: center; gap: 8px; }
.agave-skin-tuner .ast-token { grid-template-columns: 1fr 128px; }
.agave-skin-tuner .ast-range { grid-template-columns: 76px 1fr 44px; }
.agave-skin-tuner input[type='color'] { width: 28px; height: 22px; padding: 0; border: 0; background: none; cursor: pointer; }
.agave-skin-tuner input[type='range'] { width: 100%; min-width: 0; margin: 0; accent-color: #f4f4f5; }
.agave-skin-tuner .ast-name { text-transform: capitalize; }
.agave-skin-tuner .ast-value { font: 11px ui-monospace, 'SF Mono', Menlo, monospace; text-align: end; }
.agave-skin-tuner .ast-hex { font: 11px ui-monospace, 'SF Mono', Menlo, monospace; color: inherit;
  width: 100%; box-sizing: border-box; padding: 3px 5px; border-radius: 5px;
  background: rgb(0 0 0 / 30%); border: 1px solid rgb(255 255 255 / 12%); }
.agave-skin-tuner .ast-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
`;

export default SkinTuner;
