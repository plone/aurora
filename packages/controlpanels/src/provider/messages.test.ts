import { defaultTranslate, interpolate } from './messages';

describe('interpolate', () => {
  it('replaces placeholders with their values', () => {
    expect(interpolate('Delete {count} types', { count: 2 })).toBe(
      'Delete 2 types',
    );
  });

  it('keeps placeholders without a value', () => {
    expect(interpolate('Hello {name}', {})).toBe('Hello {name}');
  });
});

describe('defaultTranslate', () => {
  it('shows the default message', () => {
    expect(
      defaultTranslate(
        { id: 'x', defaultMessage: '{title} saved' },
        { title: 'Event' },
      ),
    ).toBe('Event saved');
  });
});
