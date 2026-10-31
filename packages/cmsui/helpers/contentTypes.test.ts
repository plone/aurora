import {
  errorMessage,
  toContentTypeSettings,
  toContentTypeSummary,
  toDexterityTypePatch,
} from './contentTypes';

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

describe('toContentTypeSettings', () => {
  const response = (data: object, folderish = true) => ({
    '@id':
      'http://localhost:55001/plone/@controlpanels/dexterity-types/Document',
    title: 'Page',
    data: { title: 'Page', description: '', ...data },
    schema: {
      properties: folderish
        ? { title: {}, filter_content_types: {}, allowed_content_types: {} }
        : { title: {} },
      fieldsets: [
        { id: 'default', fields: ['title'] },
        { id: 'behaviors', fields: ['plone.dublincore', 'plone.locking'] },
      ],
    },
  });

  it('reads what can be added inside a folderish type', () => {
    expect(
      toContentTypeSettings(
        'Document',
        response({ filter_content_types: false }),
      ).allowedContents,
    ).toEqual({ mode: 'all' });
    expect(
      toContentTypeSettings(
        'Document',
        response({ filter_content_types: true, allowed_content_types: [] }),
      ).allowedContents,
    ).toEqual({ mode: 'none' });
    expect(
      toContentTypeSettings(
        'Document',
        response({
          filter_content_types: true,
          allowed_content_types: ['Image', 'File'],
        }),
      ).allowedContents,
    ).toEqual({ mode: 'selected', types: ['Image', 'File'] });
  });

  it('has no contents settings for a type that is not folderish', () => {
    const settings = toContentTypeSettings('Link', response({}, false));
    expect(settings.folderish).toBe(false);
    expect(settings).not.toHaveProperty('allowedContents');
  });

  it('lists the enabled behaviors', () => {
    expect(
      toContentTypeSettings(
        'Document',
        response({ 'plone.dublincore': true, 'plone.locking': false }),
      ).behaviors,
    ).toEqual(['plone.dublincore']);
  });
});

describe('toDexterityTypePatch', () => {
  it('patches only what changed', () => {
    expect(toDexterityTypePatch({ description: 'Pages' })).toEqual({
      description: 'Pages',
    });
  });

  it("writes the overview form's contents choice", () => {
    expect(
      toDexterityTypePatch({
        allowedContents: { mode: 'selected', types: ['Image'] },
      }),
    ).toEqual({
      filter_content_types: 'some',
      allowed_content_types: ['Image'],
    });
    expect(toDexterityTypePatch({ allowedContents: { mode: 'none' } })).toEqual(
      { filter_content_types: 'none', allowed_content_types: [] },
    );
    expect(toDexterityTypePatch({ allowedContents: { mode: 'all' } })).toEqual({
      filter_content_types: 'all',
    });
  });
});
