import { isValidShortName, toShortName } from './shortName';

describe('toShortName', () => {
  it('derives a short name from a name', () => {
    expect(toShortName('Meeting minutes')).toBe('meeting_minutes');
    expect(toShortName('  Café & Bar! ')).toBe('cafe_bar');
  });
});

describe('isValidShortName', () => {
  it('accepts lowercase letters, digits and underscores', () => {
    expect(isValidShortName('meeting_minutes2')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isValidShortName('')).toBe(false);
    expect(isValidShortName('2fast')).toBe(false);
    expect(isValidShortName('News Item')).toBe(false);
  });
});
