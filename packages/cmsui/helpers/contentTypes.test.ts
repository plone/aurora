import { errorMessage, toContentTypeSummary } from './contentTypes';

describe('toContentTypeSummary', () => {
  it('turns a dexterity types item into a list row', () => {
    expect(
      toContentTypeSummary({
        '@id':
          'http://localhost:55001/plone/@controlpanels/dexterity-types/Event',
        id: 'Event',
        title: 'Event',
        description: 'Events can be shown in calendars.',
        meta_type: 'Dexterity FTI',
        count: 4,
      }),
    ).toEqual({
      id: 'Event',
      title: 'Event',
      description: 'Events can be shown in calendars.',
      kind: 'dexterity',
      count: 4,
    });
  });

  it('marks the site root and types that are not Dexterity types', () => {
    expect(
      toContentTypeSummary({ '@id': '', id: 'Plone Site', title: 'Plone Site' })
        .kind,
    ).toBe('site');
    expect(
      toContentTypeSummary({
        '@id': '',
        id: 'Discussion Item',
        title: 'Comment',
        meta_type: 'Factory-based Type Information',
      }).kind,
    ).toBe('other');
  });

  it('counts missing item counts as zero', () => {
    expect(
      toContentTypeSummary({ '@id': '', id: 'Link', title: 'Link' }).count,
    ).toBe(0);
  });
});

describe('errorMessage', () => {
  it('prefers the message the content API sends', () => {
    expect(
      errorMessage({ data: { message: 'Type already exists' } }, 'Failed'),
    ).toBe('Type already exists');
    expect(errorMessage({}, 'Failed')).toBe('Failed');
  });
});
