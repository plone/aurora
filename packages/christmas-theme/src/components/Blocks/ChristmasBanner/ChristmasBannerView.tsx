import type { BlockViewProps } from '@plone/types';

export default function ChristmasBannerView(props: BlockViewProps) {
  const { data } = props;

  const greeting =
    data.greeting !== undefined
      ? (data.greeting as string)
      : "Season's Greetings!";
  const message =
    data.message !== undefined
      ? (data.message as string)
      : 'Wishing you a joyful holiday season and a prosperous New Year.';
  const decorations =
    data.decorations !== undefined
      ? (data.decorations as string)
      : '🎄 ❄️ 🎁 🎅';
  const variant = (data.variant as string) || 'evergreen';

  return (
    <div className="block-christmas_banner" data-variant={variant}>
      <div className="block-christmas_banner__wrapper">
        <span className="block-christmas_banner__icon" aria-hidden="true">
          🎄
        </span>
        <div className="block-christmas_banner__content">
          {greeting && (
            <strong className="block-christmas_banner__greeting">
              {greeting}
            </strong>
          )}
          {message && (
            <span className="block-christmas_banner__message">
              {greeting ? ` ${message}` : message}
            </span>
          )}
        </div>
        {decorations && (
          <span
            className="block-christmas_banner__decorations"
            aria-hidden="true"
          >
            {decorations}
          </span>
        )}
      </div>
    </div>
  );
}
