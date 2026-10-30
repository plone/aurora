import {
  fallbackTranslate,
  interpolate,
  toTranslate,
  translationFromIntl,
} from './messages';

describe('interpolate', () => {
  it('replaces placeholders with their values', () => {
    expect(interpolate('Delete {{count}} types', { count: 2 })).toBe(
      'Delete 2 types',
    );
  });

  it('keeps placeholders without a value', () => {
    expect(interpolate('Hello {{name}}', {})).toBe('Hello {{name}}');
  });
});

describe('fallbackTranslate', () => {
  it('shows the default message', () => {
    expect(
      toTranslate(fallbackTranslate)(
        { id: 'x', defaultMessage: '{{title}} saved' },
        { title: 'Event' },
      ),
    ).toBe('Event saved');
  });
});

describe('toTranslate', () => {
  it("passes the message's key, English text and values to the app's t", () => {
    const t = vi.fn(() => 'Gespeichert');
    expect(
      toTranslate(t)(
        { id: 'controlpanels.saved', defaultMessage: '{{title}} saved' },
        { title: 'Event' },
      ),
    ).toBe('Gespeichert');
    expect(t).toHaveBeenCalledWith('controlpanels.saved', {
      title: 'Event',
      defaultValue: '{{title}} saved',
      // React escapes what it renders, so i18next mustn't escape too.
      interpolation: { escapeValue: false },
    });
  });
});

describe('translationFromIntl', () => {
  it('asks react-intl with ICU placeholders', () => {
    const formatMessage = vi.fn(() => 'Event saved');
    const t = translationFromIntl({ formatMessage });
    expect(
      t('controlpanels.saved', {
        defaultValue: '{{title}} saved',
        title: 'Event',
        interpolation: { escapeValue: false },
      }),
    ).toBe('Event saved');
    expect(formatMessage).toHaveBeenCalledWith(
      { id: 'controlpanels.saved', defaultMessage: '{title} saved' },
      { title: 'Event' },
    );
  });
});
