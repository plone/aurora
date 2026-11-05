/**
 * ChristmasBanner Component
 *
 * Injected into the `aboveContent` slot by `@plone/christmas-theme`.
 * Displays a joyful holiday greeting bar right above the main page content.
 */
export function ChristmasBanner() {
  return (
    <aside className="christmas-theme-banner" aria-label="Holiday Greeting">
      <div className="christmas-theme-banner__inner">
        <span className="christmas-theme-banner__icon" aria-hidden="true">
          🎄
        </span>
        <div className="christmas-theme-banner__text">
          <strong>Season&apos;s Greetings!</strong> Wishing you a joyous holiday
          and a peaceful New Year.
        </div>
        <span
          className="christmas-theme-banner__decorations"
          aria-hidden="true"
        >
          ❄️ 🎁 🎅
        </span>
      </div>
    </aside>
  );
}

export default ChristmasBanner;
