import { stateColor } from './stateColor';

describe('stateColor', () => {
  it('uses the color of a core state', () => {
    expect(stateColor({ id: 'published', visibility: 'anyone' })).toBe('green');
    expect(stateColor({ id: 'pending', visibility: 'restricted' })).toBe(
      'yellow',
    );
  });

  it('prefers the color the backend sets', () => {
    expect(
      stateColor({ id: 'published', visibility: 'anyone', color: 'teal' }),
    ).toBe('teal');
  });

  it('prefers the overrides over everything else', () => {
    expect(
      stateColor(
        { id: 'published', visibility: 'anyone', color: 'teal' },
        { published: 'blue' },
      ),
    ).toBe('blue');
  });

  it('derives a color from the visibility of a custom state', () => {
    expect(stateColor({ id: 'in_print', visibility: 'anyone' })).toBe('green');
    expect(stateColor({ id: 'team_review', visibility: 'members' })).toBe(
      'blue',
    );
    expect(stateColor({ id: 'archived', visibility: 'restricted' })).toBe(
      'gray',
    );
  });
});
