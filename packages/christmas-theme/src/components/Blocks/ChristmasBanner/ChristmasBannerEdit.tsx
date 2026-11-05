import { useEffect } from 'react';
import type { BlockEditProps } from '@plone/types';

export const DEFAULT_GREETING = "Season's Greetings!";
export const DEFAULT_MESSAGE =
  'Wishing you a joyful holiday season and a prosperous New Year.';
export const DEFAULT_DECORATIONS = '🎄 ❄️ 🎁 🎅';
export const DEFAULT_VARIANT = 'evergreen';

export default function ChristmasBannerEdit(props: BlockEditProps) {
  const { data, setBlock, selected } = props;

  // Initialize defaults in block data so the sidebar immediately displays them
  useEffect(() => {
    const updates: Record<string, any> = {};
    if (data.greeting === undefined) updates.greeting = DEFAULT_GREETING;
    if (data.message === undefined) updates.message = DEFAULT_MESSAGE;
    if (data.decorations === undefined) {
      updates.decorations = DEFAULT_DECORATIONS;
    }
    if (data.variant === undefined) updates.variant = DEFAULT_VARIANT;

    if (Object.keys(updates).length > 0) {
      setBlock({
        ...data,
        ...updates,
      });
    }
  }, [data, setBlock]);

  const greeting =
    data.greeting !== undefined
      ? (data.greeting as string)
      : DEFAULT_GREETING;
  const message =
    data.message !== undefined ? (data.message as string) : DEFAULT_MESSAGE;
  const decorations =
    data.decorations !== undefined
      ? (data.decorations as string)
      : DEFAULT_DECORATIONS;
  const variant = (data.variant as string) || DEFAULT_VARIANT;

  const className = [
    'block-christmas_banner',
    'block-christmas_banner--edit',
    selected ? 'block-christmas_banner--selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className} data-variant={variant}>
      <div className="block-christmas_banner__wrapper">
        <span className="block-christmas_banner__icon" aria-hidden="true">
          🎄
        </span>
        <div className="block-christmas_banner__content">
          <input
            type="text"
            className="block-christmas_banner__greeting-inline"
            value={greeting}
            placeholder="Headline (optional)..."
            aria-label="Greeting headline"
            onChange={(e) => setBlock({ ...data, greeting: e.target.value })}
          />
          <input
            type="text"
            className="block-christmas_banner__message-inline"
            value={message}
            placeholder="Holiday message (optional)..."
            aria-label="Holiday message"
            onChange={(e) => setBlock({ ...data, message: e.target.value })}
          />
        </div>
        <input
          type="text"
          className="block-christmas_banner__decorations-inline"
          value={decorations}
          placeholder="🎄 ❄️ 🎁 🎅"
          aria-label="Holiday decorations"
          onChange={(e) => setBlock({ ...data, decorations: e.target.value })}
        />
      </div>
    </div>
  );
}
